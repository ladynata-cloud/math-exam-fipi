'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom');
const html=fs.readFileSync(path.join(__dirname,'../trainers/oge-task11-graphs-trainer.html'),'utf8');
const KEY='mathExamCourseProgress.v1',TID='oge-t11-grafiki';
function boot(t,options={}){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(html,{url:'https://mathexam.space/trainers/oge-task11-graphs-trainer.html'+(options.query||''),runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
  w.scrollTo=()=>{};if(options.shared)w.OgeCourseSharedMode=true;
  if(options.managed)w.MathExamLearning={managed:true};
  let n=10000;Object.defineProperty(w.crypto,'getRandomValues',{value:array=>{for(let i=0;i<array.length;i++)array[i]=options.fixedSeed??(++n*1097)>>>0;return array;}});
  for(const[k,v]of Object.entries(options.storage||{}))w.localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v));
  if(options.blocked)Object.defineProperty(w,'localStorage',{get(){throw new w.DOMException('Unavailable','SecurityError');}});
 }});t.after(()=>dom.window.close());const w=dom.window,d=w.document;
 return {w,d,errors,el:id=>d.getElementById(id),api:w.Task11Learning,eval:s=>w.eval(s),all:()=>JSON.parse(w.localStorage.getItem(KEY)||'{}'),records:()=>JSON.parse(w.localStorage.getItem(KEY)||'{}')[TID]?.ext?.auditLearning?.attempts||[],storage:()=>Object.fromEntries(Array.from({length:w.localStorage.length},(_,i)=>{const k=w.localStorage.key(i);return [k,w.localStorage.getItem(k)];})),input(id,value,type='input'){const el=d.getElementById(id);el.value=String(value);el.dispatchEvent(new w.Event(type,{bubbles:true}));},click(id){d.getElementById(id).click();}};
}
function correctM4(f){f.input('m4-answer',f.eval('M4.task.key.join("")'));f.click('m4-check');}
function correctM1(f){const i=f.eval('M1.q.opts.findIndex(x=>x.ok)');f.el('m1-opts').children[i].click();}
function step3(f){if(f.eval('M3.kind')==='par'){f.input('m3-x0',f.eval('M3.task.p.x0'));f.click('m3-check1');}else{const kind=f.eval('M3.kind'),ys=f.eval('M3.task.ys');const button=[...f.el('m3-stage').querySelectorAll('.opts .btn')].find(b=>kind==='hyp'?b.dataset.q===(f.eval('M3.task.m')>0?'13':'24'):b.textContent==='(0; '+String(ys[0]).replace('-','−')+')');assert(button);button.click();}}
function table3(f){const values=f.eval('M3.task.ys');[...f.el('m3-stage').querySelectorAll('table.pts input')].forEach((n,i)=>{n.value=String(values[i]);n.dispatchEvent(new f.w.Event('input',{bubbles:true}));});f.click('m3-checkT');}
function foreignStore(){return {[KEY]:{
 'another-trainer':{v:1,solvedByType:{a:4},ext:{retain:'yes'}},
 [TID]:{v:1,solvedByType:{t42:7},ext:{skills:{oge:{total:5,first:5}},unrelated:{preserve:['a',2]}}}
 }};}

test('M4 help, closing, reload and a correct answer keep help evidence without changing old counts on restore',t=>{
 const f=boot(t,{storage:foreignStore()}),before=f.all(),key=f.api.getState('m4').taskKey;
 f.input('m4-answer','23');f.click('m4-hint');f.click('m4-hint');
 const saved=f.storage();assert.equal(f.records().length,0);assert.equal(f.api.getState('m4').helpUsed,true);
 const g=boot(t,{storage:saved});assert.equal(g.api.getState('m4').taskKey,key);assert.equal(g.el('m4-answer').value,'23');assert.equal(g.api.getState('m4').helpUsed,true);
 assert.deepEqual(g.all()['another-trainer'],before['another-trainer']);assert.deepEqual(g.all()[TID].solvedByType,before[TID].solvedByType);assert.deepEqual(g.all()[TID].ext.skills,before[TID].ext.skills);
 correctM4(g);assert.equal(g.records().length,1);assert.equal(g.records()[0].outcome,'helped');assert.equal(g.records()[0].helpUsed,true);assert.match(g.el('task11-learning-m4').textContent,/с помощью/);
 const completed=g.storage(),core=g.all()[TID].solvedByType;g.click('m4-check');assert.equal(g.records().length,1);
 const h=boot(t,{storage:completed});h.click('m4-check');assert.equal(h.records().length,1);assert.deepEqual(h.all()[TID].solvedByType,core);
 assert.deepEqual(h.all()[TID].ext.unrelated,before[TID].ext.unrelated);assert.deepEqual([...f.errors,...g.errors,...h.errors],[]);
});

test('M1 counts automatic mathematical feedback as help and keeps first correct answers separate',t=>{
 const f=boot(t);f.click('m1-hint');correctM1(f);assert.equal(f.records().at(-1).outcome,'helped');
 f.api.generate('m1',{fresh:true,type:'family'});const wrong=f.eval('M1.q.opts.findIndex(x=>!x.ok)');f.el('m1-opts').children[wrong].click();assert(f.api.getState('m1').helpKinds.includes('automatic-feedback'));correctM1(f);assert.equal(f.records().at(-1).outcome,'helped');
 f.api.generate('m1',{fresh:true,type:'linK'});correctM1(f);assert.equal(f.records().at(-1).outcome,'independent');
 const n=f.records().length;correctM1(f);f.click('m1-next');assert.equal(f.records().length,n);assert.deepEqual(f.errors,[]);
});

test('M2 vertex prediction marks a hint and the revealed graph as help',t=>{
 const f=boot(t);f.click('m2g-hint');const truth=f.eval('M2G.p.x0===0?"zero":M2G.p.x0<0?"left":"right"');f.d.querySelector('#m2g-opts [data-v="'+truth+'"]').click();f.click('m2g-build');assert.equal(f.records().at(-1).outcome,'helped');
 f.api.generate('m2',{fresh:true});const nextTruth=f.eval('M2G.p.x0===0?"zero":M2G.p.x0<0?"left":"right"'),wrong=['left','zero','right'].find(x=>x!==nextTruth);f.d.querySelector('#m2g-opts [data-v="'+wrong+'"]').click();f.click('m2g-build');assert.equal(f.api.getState('m2').completed,false);
 f.d.querySelector('#m2g-opts [data-v="'+nextTruth+'"]').click();const saved=f.storage();const g=boot(t,{storage:saved});assert.equal(g.api.getState('m2').completed,false,'changing the forecast after seeing the graph must not auto-complete on reload');
 g.click('m2g-build');assert.equal(g.records().at(-1).outcome,'helped');assert.equal(g.records().at(-1).wrong,1);assert.deepEqual([...f.errors,...g.errors],[]);
});

test('M3 restores the vertex step and partial table; opening vertex guidance stays sticky',t=>{
 const f=boot(t);step3(f);const fields=f.el('m3-stage').querySelectorAll('table.pts input');assert.equal(fields.length,5);fields[0].value='12';fields[0].dispatchEvent(new f.w.Event('input',{bubbles:true}));
 f.el('m3-vertex').querySelector('summary').click();f.el('m3-vertex').querySelector('summary').click();
 const original=f.el('m3-formula').textContent,saved=f.storage();const g=boot(t,{storage:saved});
 assert.equal(g.el('m3-formula').textContent,original);assert.equal(g.el('m3-stage').querySelector('table.pts input').value,'12');assert.equal(g.api.getState('m3').helpUsed,true);
 table3(g);assert.equal(g.records().at(-1).outcome,'helped');const n=g.records().length;g.click('m3-checkT');assert.equal(g.records().length,n);
 const old=g.api.getState('m3').taskKey;g.d.querySelector('[data-task11-next="m3"]').click();assert.equal(g.eval('M3.kind'),'par');assert.notEqual(g.api.getState('m3').taskKey,old);assert.equal(g.api.getState('m3').helpUsed,false);assert.deepEqual([...f.errors,...g.errors],[]);
});

test('M3 each family completes through the real choices and table, and repeated first step retains its draft',t=>{
 const f=boot(t);
 for(const kind of ['lin','hyp','root','par']){
  f.eval('M3.kind='+JSON.stringify(kind));f.api.generate('m3',{fresh:true});step3(f);
  const field=f.el('m3-stage').querySelector('table.pts input');field.value='-17';field.dispatchEvent(new f.w.Event('input',{bubbles:true}));
  const first=f.el('m3-stage').querySelector('.opts .good');if(first)first.click();else f.click('m3-check1');
  assert.equal(f.el('m3-stage').querySelector('table.pts input').value,'-17',kind+' keeps table');
  table3(f);assert.equal(f.records().at(-1).outcome,'independent',kind);assert.equal(f.records().at(-1).fresh,true,kind);
 }
 assert.deepEqual(f.errors,[]);
});

test('M3 linear b=0 has one correct point and unique distractors',t=>{
 const f=boot(t);f.eval('M3.kind="lin"');let found=false;
 for(let i=0;i<80;i++){f.api.generate('m3');if(f.eval('M3.task.ys[0]')!==0)continue;found=true;const choices=[...f.el('m3-linstart').children];assert.equal(new Set(choices.map(n=>n.textContent)).size,choices.length);assert.equal(choices.filter(n=>n.textContent==='(0; 0)').length,1);choices.find(n=>n.textContent==='(0; 0)').click();assert(f.el('m3-stage').querySelector('table.pts'));assert.equal(f.eval('M3.choiceWrongs'),0);break;}
 assert(found,'zero intercept was actually generated');assert.deepEqual(f.errors,[]);
});

test('M4 new independent condition keeps the skill after help and never reuses the previous mathematical condition',t=>{
 const f=boot(t);f.eval('M4.type="t43"');f.api.generate('m4');const before=f.api.getState('m4').taskKey;
 f.d.querySelector('.function-help').click();f.click('t11-help-close');assert.equal(f.api.getState('m4').helpUsed,true);
 f.d.querySelector('[data-task11-next="m4"]').click();assert.equal(f.eval('M4.task.type'),'t43');assert.notEqual(f.api.getState('m4').taskKey,before);assert.equal(f.api.getState('m4').helpUsed,false);
 correctM4(f);assert.equal(f.records().at(-1).outcome,'independent');assert.deepEqual(f.errors,[]);
});

test('a stale tab restores the newer answer and assistance before it can grade or overwrite it',t=>{
 const f=boot(t);f.input('m4-answer','12');const g=boot(t,{storage:f.storage()});g.input('m4-answer','23');g.click('m4-hint');
 const fresh=g.w.localStorage.getItem(KEY);f.w.localStorage.setItem(KEY,fresh);f.w.dispatchEvent(new f.w.StorageEvent('storage',{key:KEY,newValue:fresh}));
 f.click('m4-check');assert.equal(f.el('m4-answer').value,'23');assert.equal(f.api.getState('m4').helpUsed,true);assert.equal(f.api.getState('m4').wrong,0);assert.equal(f.records().length,0);assert.equal(f.w.localStorage.getItem(KEY),fresh);
 assert.match(f.el('task11-learning-m4').textContent,/свеж|вкладк/);assert.deepEqual([...f.errors,...g.errors],[]);
});

test('one stale pointer gesture cannot submit a peer draft through its focus change, even when the peer answer is correct',t=>{
 for(const peerCorrect of [false,true]){
  const f=boot(t);f.input('m4-answer','12');f.el('m4-answer').focus();
  const g=boot(t,{storage:f.storage()});g.input('m4-answer',peerCorrect?g.eval('M4.task.key.join("")'):'23');g.click('m4-hint');g.click('m4-hint');
  const latest=g.w.localStorage.getItem(KEY),answer=g.el('m4-answer').value;
  f.w.localStorage.setItem(KEY,latest);f.w.dispatchEvent(new f.w.StorageEvent('storage',{key:KEY,newValue:latest}));
  const down=new f.w.MouseEvent('pointerdown',{bubbles:true,cancelable:true});f.el('m4-check').dispatchEvent(down);
  // A browser commits a dirty text field while moving focus to the button.
  // Queued focus events and the ensuing click belong to that same gesture.
  f.el('m4-answer').dispatchEvent(new f.w.Event('change',{bubbles:true,cancelable:true}));f.click('m4-check');
  assert.equal(f.el('m4-answer').value,answer);assert.equal(f.api.getState('m4').helpUsed,true);
  assert.equal(f.w.localStorage.getItem(KEY),latest,'the entire stale gesture must preserve both draft bytes and legacy credit');
  assert.equal(f.records().length,0);assert.equal(down.defaultPrevented,true);
  // The next distinct pointer gesture remains usable and can complete once.
  const nextDown=new f.w.MouseEvent('pointerdown',{bubbles:true,cancelable:true});f.el('m4-answer').dispatchEvent(nextDown);assert.equal(nextDown.defaultPrevented,false,'normal focus remains available on the next gesture');correctM4(f);
  assert.equal(f.records().length,1);assert.equal(f.records()[0].outcome,'helped');f.click('m4-check');assert.equal(f.records().length,1);
  assert.deepEqual([...f.errors,...g.errors],[]);
 }
});

test('a stale change followed by a deliberate keyboard activation restores first and then accepts the new action',t=>{
 const f=boot(t);f.input('m4-answer','12');const g=boot(t,{storage:f.storage()});
 g.input('m4-answer',g.eval('M4.task.key.join("")'));g.click('m4-hint');const latest=g.w.localStorage.getItem(KEY);
 f.w.localStorage.setItem(KEY,latest);f.el('m4-answer').dispatchEvent(new f.w.Event('change',{bubbles:true,cancelable:true}));
 assert.equal(f.w.localStorage.getItem(KEY),latest);assert.equal(f.records().length,0);
 f.el('m4-check').dispatchEvent(new f.w.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));f.click('m4-check');
 assert.equal(f.records().length,1);assert.equal(f.records()[0].outcome,'helped');assert.deepEqual([...f.errors,...g.errors],[]);
});

test('an interrupted pointer gesture cannot activate a replacement task but a new gesture can navigate and start one',t=>{
 const f=boot(t);f.input('m4-answer','12');const g=boot(t,{storage:f.storage()});
 g.api.generate('m4',{fresh:true,starter:false});g.input('m4-answer',g.eval('M4.task.key.join("")'));g.click('m4-hint');
 const latest=g.w.localStorage.getItem(KEY),key=g.api.getState('m4').taskKey;f.w.localStorage.setItem(KEY,latest);
 f.el('m4-check').dispatchEvent(new f.w.MouseEvent('pointerdown',{bubbles:true,cancelable:true}));
 f.el('m4-answer').dispatchEvent(new f.w.Event('change',{bubbles:true,cancelable:true}));
 f.d.querySelector('[data-task11-next="m4"]').click();
 assert.equal(f.w.localStorage.getItem(KEY),latest,'a click landing on a restored control is still the old gesture');assert.equal(f.api.getState('m4').taskKey,key);assert.equal(f.records().length,0);
 const other=f.d.querySelector('#tabs [data-m="m1"]');other.dispatchEvent(new f.w.MouseEvent('pointerdown',{bubbles:true,cancelable:true}));other.click();
 assert.equal(f.d.querySelector('section.module.active').id,'m1');assert.equal(f.records().length,0);
 const back=f.d.querySelector('#tabs [data-m="m4"]');back.dispatchEvent(new f.w.MouseEvent('pointerdown',{bubbles:true,cancelable:true}));back.click();
 const next=f.d.querySelector('[data-task11-next="m4"]');next.dispatchEvent(new f.w.MouseEvent('pointerdown',{bubbles:true,cancelable:true}));next.click();
 assert.notEqual(f.api.getState('m4').taskKey,key);assert.equal(f.api.getState('m4').completed,false);assert.equal(f.api.getState('m4').helpUsed,false);assert.equal(f.records().length,0);assert.deepEqual([...f.errors,...g.errors],[]);
});

test('restoring several drafts and receiving a storage event never echo a write, including delayed details toggles',async t=>{
 const settle=()=>new Promise(resolve=>setTimeout(resolve,35)),f=boot(t);
 f.click('m1-hint');step3(f);f.input('m3-x0','-3');f.input('m4-answer','12');
 f.d.querySelector('.function-help').click();f.el('t11-help-dali').open=true;await settle();
 const saved=f.storage(),g=boot(t,{storage:saved});await settle();assert.equal(g.w.localStorage.getItem(KEY),saved[KEY],'ordinary reload must not echo any module revision');
 g.input('m4-answer','23');g.click('m4-hint');g.click('m4-hint');await settle();const latest=g.w.localStorage.getItem(KEY);
 f.w.localStorage.setItem(KEY,latest);f.w.dispatchEvent(new f.w.StorageEvent('storage',{key:KEY,newValue:latest}));await settle();assert.equal(f.w.localStorage.getItem(KEY),latest,'storage notification remains read-only');
 f.click('m4-check');await settle();assert.equal(f.el('m4-answer').value,'23');assert.equal(f.api.getState('m4').helpUsed,true);assert.equal(f.w.localStorage.getItem(KEY),latest,'restoring before a stale check must not echo delayed model-toggle events');assert.deepEqual([...f.errors,...g.errors],[]);
});

test('the same full condition with a new attempt id is familiar, never a new independent success',t=>{
 const f=boot(t,{fixedSeed:123456});f.eval('M4.type="t43"');f.api.generate('m4',{starter:false});const key=f.api.getState('m4').taskKey;correctM4(f);
 f.api.generate('m4',{starter:false});assert.equal(f.api.getState('m4').taskKey,key);correctM4(f);assert.equal(f.records().at(-1).outcome,'familiar');assert.equal(f.records().at(-1).fresh,false);assert.deepEqual(f.errors,[]);
});

test('an exhausted six-condition hyperbola bank repeats honestly and restores the exact built seed',t=>{
 const f=boot(t,{fixedSeed:123456}),keys=new Set();
 for(let i=0;i<6;i++){f.api.generate('m4',{type:'t44',starter:false,fresh:true});assert.equal(f.api.getState('m4').fresh,true,'unseen conditions are used first');keys.add(f.api.getState('m4').taskKey);}
 assert.equal(keys.size,6);const previous=f.api.getState('m4').taskKey;
 f.api.generate('m4',{type:'t44',starter:false,fresh:true});const repeat=f.api.getState('m4');assert.equal(repeat.fresh,false);assert(keys.has(repeat.taskKey));assert.notEqual(repeat.taskKey,previous,'another known condition is preferable to the same screen');
 f.input('m4-answer','23');f.click('m4-hint');f.click('m4-hint');const graph=f.el('m4-graphs').innerHTML;
 const g=boot(t,{storage:f.storage(),fixedSeed:123456});assert.equal(g.api.getState('m4').id,repeat.id);assert.equal(g.api.getState('m4').taskKey,repeat.taskKey);assert.equal(g.eval('M4.task.type'),'t44');assert.equal(g.el('m4-graphs').innerHTML,graph);assert.equal(g.el('m4-answer').value,'23');assert.equal(g.api.getState('m4').helpUsed,true);assert.doesNotMatch(g.el('task11-learning-m4').textContent,/не удалось восстановить/);
 correctM4(g);assert.equal(g.records().at(-1).outcome,'familiar');assert.equal(g.records().at(-1).fresh,false);assert.equal(g.records().at(-1).helpUsed,true);assert.deepEqual([...f.errors,...g.errors],[]);
});

test('shared and selftest modes have no public evidence UI, storage or seeded generation',t=>{
 for(const options of [{shared:true},{managed:true},{query:'?selftest=1'}]){const f=boot(t,options);assert.equal(f.api.enabled,false);assert(!f.d.querySelector('.task11-learning'));assert.equal(f.w.localStorage.getItem(KEY),null);assert.deepEqual(f.errors,[]);}
});

test('old first-choice totals never declare mastery; denied storage leaves the task usable',t=>{
 const f=boot(t,{storage:foreignStore()});f.eval('renderDiagnostics()');assert.doesNotMatch(f.el('m5-map').textContent,/освоено/);assert.match(f.el('m5-map').textContent,/помощь в старых записях не различается/);
 const g=boot(t,{blocked:true});g.click('m4-hint');g.click('m4-hint');correctM4(g);assert.equal(g.eval('M4.done'),true);assert.match(g.el('task11-learning-m4').textContent,/Не удалось сохранить/);assert.deepEqual([...f.errors,...g.errors],[]);
});

test('automatic feedback survives reload in M1, M3 and M4 without being recast as an unaided correction',t=>{
 const f=boot(t);f.api.generate('m1',{type:'linB'});
 const wrong=f.eval('M1.q.opts.findIndex(x=>!x.ok)');f.el('m1-opts').children[wrong].click();
 f.input('m3-x0',f.eval('M3.task.p.x0+1'));f.click('m3-check1');
 const key=f.eval('M4.task.key');f.input('m4-answer',[key[1],key[0],key[2]].join(''));f.click('m4-check');
 for(const m of ['m1','m3','m4']){assert.equal(f.api.getState(m).helpUsed,true,m);assert(f.api.getState(m).helpKinds.includes('automatic-feedback'),m);}
 const g=boot(t,{storage:f.storage()});correctM1(g);step3(g);table3(g);correctM4(g);
 assert.equal(g.records().length,3);assert(g.records().every(r=>r.outcome==='helped'&&r.helpUsed));assert.deepEqual([...f.errors,...g.errors],[]);
});

test('neutral partial-table feedback permits an own correction, while mathematical table feedback is help',t=>{
 const f=boot(t);step3(f);const field=f.el('m3-stage').querySelector('table.pts input');
 field.value=String(f.eval('M3.task.ys[0]+1'));field.dispatchEvent(new f.w.Event('input',{bubbles:true}));f.click('m3-checkT');
 assert.match(f.el('m3-soft').textContent,/Заполни все клетки/);assert.equal(f.api.getState('m3').wrong,1);assert.equal(f.api.getState('m3').helpUsed,false);
 table3(f);assert.equal(f.records().at(-1).outcome,'corrected');
 f.api.generate('m3',{fresh:true});step3(f);
 [...f.el('m3-stage').querySelectorAll('table.pts input')].forEach((n,i)=>{n.value=String(f.eval('M3.task.ys')[i]+1);n.dispatchEvent(new f.w.Event('input',{bubbles:true}));});
 f.click('m3-checkT');assert(f.api.getState('m3').helpKinds.includes('automatic-feedback'));table3(f);assert.equal(f.records().at(-1).outcome,'helped');assert.deepEqual(f.errors,[]);
});

test('resume describes actual unfinished work and pagehide does not invent work in unseen modules',t=>{
 const f=boot(t);assert.equal(f.api.projection().resume,undefined);assert.deepEqual(Object.keys(f.api.projection().draft),['m4']);
 f.w.dispatchEvent(new f.w.PageTransitionEvent('pagehide'));assert.equal(f.api.projection().resume,undefined);assert.deepEqual(Object.keys(f.api.projection().draft),['m4']);
 f.input('m4-answer','2');let resume=f.api.projection().resume;assert.equal(resume.hasWork,true);assert.equal(resume.unfinished,true);assert.equal(resume.skill,'oge');assert.equal(resume.helpUsed,false);
 f.click('m4-hint');assert.equal(f.api.projection().resume.helpUsed,true);
 f.input('m3-x0','7');correctM4(f);resume=f.api.projection().resume;assert.equal(resume.module,'m3','unfinished work takes priority over a later completed task');assert.equal(resume.unfinished,true);
 step3(f);table3(f);resume=f.api.projection().resume;assert.equal(resume.hasWork,true);assert.equal(resume.unfinished,false);assert.equal(resume.module,'m3');assert.equal(resume.skill,'build');
 const saved=f.storage();f.w.dispatchEvent(new f.w.PageTransitionEvent('pagehide'));const g=boot(t,{storage:saved});assert.deepEqual(JSON.parse(JSON.stringify(g.api.projection().resume)),JSON.parse(JSON.stringify(resume)));assert.deepEqual([...f.errors,...g.errors],[]);
});

test('the explicit course resume link opens the exact unfinished module while ordinary reload retains the chosen module',t=>{
 const f=boot(t);f.d.querySelector('#tabs [data-m="m3"]').click();step3(f);
 const field=f.el('m3-stage').querySelector('table.pts input');field.value='7/3';field.dispatchEvent(new f.w.Event('input',{bubbles:true}));
 const key=f.api.getState('m3').taskKey;f.d.querySelector('#tabs [data-m="m4"]').click();assert.equal(f.api.projection().activeModule,'m4');assert.equal(f.api.projection().resume.module,'m3');
 const g=boot(t,{storage:f.storage()});assert.equal(g.d.querySelector('section.module.active').id,'m4');
 const h=boot(t,{storage:f.storage(),query:'?resume=1'});assert.equal(h.d.querySelector('section.module.active').id,'m3');assert.equal(h.api.getState('m3').taskKey,key);assert.equal(h.el('m3-stage').querySelector('table.pts input').value,'7/3');assert.equal(new URL(h.w.location.href).searchParams.has('resume'),false,'the map intent is consumed so later ordinary reloads respect navigation');
 assert.deepEqual([...f.errors,...g.errors,...h.errors],[]);
});

test('an incompatible mathematical draft rolls back safely and a later valid draft reopens exactly',t=>{
 const f=boot(t);f.input('m4-answer','23');step3(f);
 const store=f.storage(),data=JSON.parse(store[KEY]);data[TID].ext.auditLearning.draft.m4.seed=(data[TID].ext.auditLearning.draft.m4.seed+77)>>>0;
 data[TID].ext.auditLearning.draft.m3.state.table=[];store[KEY]=JSON.stringify(data);
 const g=boot(t,{storage:store});assert.equal(g.api.restoring,false);assert.match(g.el('task11-learning-m4').textContent,/не удалось восстановить/);
 assert.equal(g.el('m3-stage').querySelectorAll('table.pts input').length,0,'failed restoration does not leave a table from another task behind');
 const graph=g.el('m4-graphs').innerHTML;correctM4(g);step3(g);table3(g);const key=g.api.getState('m4').taskKey;
 const h=boot(t,{storage:g.storage()});assert.equal(h.api.getState('m4').taskKey,key);assert.equal(h.el('m4-graphs').innerHTML,graph);assert.equal(h.api.getState('m4').completed,true);assert.equal(h.records().length,2);assert.deepEqual([...f.errors,...g.errors,...h.errors],[]);
});

test('future evidence is preserved while practice remains usable, and a full seen-key memory never invents freshness',t=>{
 const future={v:2,newField:{untouched:true}},f=boot(t,{storage:{[KEY]:{[TID]:{v:1,ext:{auditLearning:future,foreign:['retain']}}}}});
 f.click('m4-hint');correctM4(f);assert.equal(f.eval('M4.done'),true);assert.deepEqual(f.all()[TID].ext.auditLearning,future);assert.deepEqual(f.all()[TID].ext.foreign,['retain']);assert.match(f.el('task11-learning-m4').textContent,/более новый формат/);
 const seenKeys=Array.from({length:600},(_,i)=>({id:'old-'+i,taskKey:'old:'+i}));
 const g=boot(t,{storage:{[KEY]:{[TID]:{ext:{auditLearning:{v:1,attempts:[],draft:{},seenKeys}}}}}});correctM4(g);
 assert.equal(g.records().at(-1).fresh,false);assert.equal(g.records().at(-1).outcome,'familiar');assert.equal(g.api.projection().seenKeys.length,600);assert.equal(g.api.projection().seenFull,true);assert.deepEqual([...f.errors,...g.errors],[]);
});


test('unchanged pagehide and reload preserve exact progress bytes without persisting the resumed display flag',t=>{
 const f=boot(t,{storage:foreignStore()}),raw=f.w.localStorage.getItem(KEY);
 f.w.dispatchEvent(new f.w.PageTransitionEvent('pagehide'));
 assert.equal(f.w.localStorage.getItem(KEY),raw,'a first view does not become a newer draft on close');
 const g=boot(t,{storage:f.storage()});assert.equal(g.api.getState('m4').resumed,true);
 assert.equal(g.api.save('m4'),true);g.w.dispatchEvent(new g.w.PageTransitionEvent('pagehide'));g.w.dispatchEvent(new g.w.PageTransitionEvent('pagehide'));
 assert.equal(g.w.localStorage.getItem(KEY),raw,'repeated save, close and restored UI leave every stored byte unchanged');
 assert.equal(g.all()[TID].ext.auditLearning.draft.m4.resumed,undefined);
 const previous=JSON.parse(raw);previous[TID].ext.auditLearning.draft.m4.resumed=true;
 const oldRaw=JSON.stringify(previous),h=boot(t,{storage:{[KEY]:oldRaw}});
 h.w.dispatchEvent(new h.w.PageTransitionEvent('pagehide'));
 assert.equal(h.w.localStorage.getItem(KEY),oldRaw,'an older transient field is ignored without a cleanup write');
 h.input('m4-answer','2');assert.equal(h.all()[TID].ext.auditLearning.draft.m4.resumed,undefined,'real work stores only durable fields');
 assert.deepEqual([...f.errors,...g.errors,...h.errors],[]);
});

test('closing restored helped, completed and partial drafts does not write any module again',async t=>{
 const settle=()=>new Promise(resolve=>setTimeout(resolve,35)),f=boot(t,{storage:foreignStore()});
 f.click('m1-hint');f.click('m2g-hint');
 const truth=f.eval('M2G.p.x0===0?"zero":M2G.p.x0<0?"left":"right"');f.d.querySelector('#m2g-opts [data-v="'+truth+'"]').click();f.click('m2g-build');
 step3(f);const field=f.el('m3-stage').querySelector('table.pts input');field.value='7/3';field.dispatchEvent(new f.w.Event('input',{bubbles:true}));
 f.input('m4-answer','23');f.click('m4-hint');f.click('m4-hint');await settle();
 const saved=f.storage(),raw=saved[KEY];assert.equal(Object.keys(f.api.projection().draft).length,4);assert.equal(f.records().length,1);
 f.w.dispatchEvent(new f.w.PageTransitionEvent('pagehide'));assert.equal(f.w.localStorage.getItem(KEY),raw);
 const g=boot(t,{storage:saved});await settle();assert.equal(g.api.getState('m2').completed,true);assert.equal(g.el('m3-stage').querySelector('table.pts input').value,'7/3');
 for(const module of ['m1','m2','m3','m4']){assert.equal(g.api.save(module),true);assert.equal(g.all()[TID].ext.auditLearning.draft[module].resumed,undefined);}
 g.w.dispatchEvent(new g.w.PageTransitionEvent('pagehide'));await settle();
 assert.equal(g.w.localStorage.getItem(KEY),raw,'all module states, revisions, attempts and resume projection remain byte-identical');
 assert.deepEqual([...f.errors,...g.errors],[]);
});

test('pagehide still flushes changed inputs in several drafts once and preserves sticky help',t=>{
 const f=boot(t,{storage:foreignStore()});step3(f);f.input('m4-answer','12');f.click('m4-hint');f.click('m4-hint');
 const before=f.all(),old=f.api.projection(),key=f.api.getState('m4').taskKey;
 f.el('m4-answer').value='23';f.el('m3-stage').querySelector('table.pts input').value='-17/2';
 f.w.dispatchEvent(new f.w.PageTransitionEvent('pagehide'));
 const updated=f.api.projection(),raw=f.w.localStorage.getItem(KEY);
 assert.equal(updated.draft.m4.state.answer,'23');assert.equal(updated.draft.m3.state.table[0],'-17/2');
 assert.equal(updated.draft.m4.rev,old.draft.m4.rev+1);assert.equal(updated.draft.m3.rev,old.draft.m3.rev+1);
 assert.equal(updated.draft.m4.helpUsed,true);assert.equal(updated.draft.m4.taskKey,key);assert.equal(f.records().length,0);
 assert.deepEqual(f.all()['another-trainer'],before['another-trainer']);assert.deepEqual(f.all()[TID].solvedByType,before[TID].solvedByType);assert.deepEqual(f.all()[TID].ext.skills,before[TID].ext.skills);
 f.w.dispatchEvent(new f.w.PageTransitionEvent('pagehide'));assert.equal(f.w.localStorage.getItem(KEY),raw,'a second flush has nothing new to write');
 const g=boot(t,{storage:f.storage()});assert.equal(g.el('m4-answer').value,'23');assert.equal(g.el('m3-stage').querySelector('table.pts input').value,'-17/2');assert.equal(g.api.getState('m4').helpUsed,true);
 g.w.dispatchEvent(new g.w.PageTransitionEvent('pagehide'));assert.equal(g.w.localStorage.getItem(KEY),raw);
 assert.deepEqual([...f.errors,...g.errors],[]);
});

test('pagehide restores a newer peer before an unsaved local input can overwrite its answer or assistance',t=>{
 for(const replacement of [false,true]){
  const f=boot(t);f.input('m4-answer','12');const g=boot(t,{storage:f.storage()});
  if(replacement)g.api.generate('m4',{fresh:true,type:'t44',starter:false});
  g.input('m4-answer','23');g.click('m4-hint');g.click('m4-hint');
  const latest=g.w.localStorage.getItem(KEY),key=g.api.getState('m4').taskKey,graph=g.el('m4-graphs').innerHTML;
  f.el('m4-answer').value='13';f.w.localStorage.setItem(KEY,latest);
  f.w.dispatchEvent(new f.w.StorageEvent('storage',{key:KEY,newValue:latest}));
  f.w.dispatchEvent(new f.w.PageTransitionEvent('pagehide'));
  assert.equal(f.w.localStorage.getItem(KEY),latest,'the stale flush is read-only');
  assert.equal(f.el('m4-answer').value,'23');assert.equal(f.api.getState('m4').taskKey,key);assert.equal(f.el('m4-graphs').innerHTML,graph);assert.equal(f.api.getState('m4').helpUsed,true);assert.equal(f.records().length,0);
  f.w.dispatchEvent(new f.w.PageTransitionEvent('pagehide'));assert.equal(f.w.localStorage.getItem(KEY),latest,'closing the restored peer draft remains a no-op');
  assert.deepEqual([...f.errors,...g.errors],[]);
 }
});
