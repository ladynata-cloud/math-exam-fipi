'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'../..'),base=path.join(root,'courses/vilenkin-6-part-1');
const C=require(path.join(base,'textbook-learning-contracts'));
const units=[...['A','B','C','D'].flatMap(name=>JSON.parse(fs.readFileSync(path.join(base,'textbook-data/units-'+name+'.json'),'utf8'))),...JSON.parse(fs.readFileSync(path.join(base,'textbook-data/supplement-lcm-multi.json'),'utf8'))];
const tasks=units.flatMap(unit=>unit.tasks),ORIGIN='https://mathexam-board-ladynata.msk1.amvera.tech',CHANNEL='fixture_textbook_channel_0001';
const copy=value=>JSON.parse(JSON.stringify(value)),tick=()=>new Promise(resolve=>setTimeout(resolve,0));
async function fixture(t){
 const dom=new JSDOM(fs.readFileSync(path.join(base,'textbook.html'),'utf8'),{url:'https://mathexam.space/courses/vilenkin-6-part-1/textbook.html?learning=1&parentOrigin='+encodeURIComponent(ORIGIN)+'&channel='+CHANNEL,runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,messages=[];let storageReads=0;
 w.TextEncoder=TextEncoder;w.scrollTo=()=>{};
 Object.defineProperty(w,'localStorage',{get(){storageReads++;throw Error('Managed mode must not access browser progress');}});
 const parent={postMessage(message,target){messages.push({message:copy(message),target});}};
 Object.defineProperty(w,'parent',{value:parent});
 w.fetch=async url=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(base,String(url)),'utf8'))});
 for(const file of ['courses/vilenkin-6-part-1/textbook-math.js','courses/vilenkin-6-part-1/textbook-source-labels.js','courses/vilenkin-6-part-1/textbook-support.js','trainers/learning-bridge.js','learning/vilenkin6-textbook-catalog.js','courses/vilenkin-6-part-1/textbook-learning-contracts.js','courses/vilenkin-6-part-1/textbook-course.js'])w.eval(fs.readFileSync(path.join(root,file),'utf8'));
 await tick();await tick();
 t.after(()=>w.close());
 const ready=messages.find(x=>x.message.type==='ready')?.message;assert(ready);
 async function hydrate(spec,state,readOnly=false,override={}){
  w.dispatchEvent(new w.MessageEvent('message',{source:parent,origin:ORIGIN,data:{...ready,type:'hydrate',payload:{taskSpec:copy(spec),state:copy(state),readOnly}},...override}));await tick();
 }
 const changes=()=>messages.filter(x=>x.message.type==='change').map(x=>x.message.payload);
 function input(value){const field=w.document.querySelector('#answer');assert(field);field.value=value;field.dispatchEvent(new w.Event('input',{bubbles:true}));}
 function submit(){w.document.querySelector('#answer-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));}
 return{w,hydrate,messages,changes,input,submit,storageReads:()=>storageReads};
}
test('all revised textbook tasks hydrate through the real credential-free bridge without local storage',async t=>{
 const f=await fixture(t);
 for(const task of tasks){const a=C.create(task.id,19);await f.hydrate(a.taskSpec,a.state);assert.equal(f.w.location.hash,a.state.route);assert(f.w.document.querySelector('.condition'));assert.equal(f.messages.at(-1).message.type,'applied');assert(!f.messages.at(-1).message.payload.error,task.id);}
 assert.equal(f.storageReads(),0);assert.equal(f.changes().length,0);assert.equal(tasks.length,require(path.join(root,'learning/vilenkin6-textbook-catalog')).length);
});
test('drafts, wrong checks, guided steps and restored work use separate cloud state',async t=>{
 const f=await fixture(t),task=tasks.find(x=>x.role==='practice'&&x.answerType!=='self-check'&&x.steps.every(s=>s.answerType!=='self-check'));
 const a=C.create(task.id,27);await f.hydrate(a.taskSpec,a.state);
 f.input('9999999');f.submit();let change=f.changes().at(-1);assert.equal(change.kind,'check');assert.equal(change.details.scope,'final');assert(!C.evaluate(a.taskSpec,change.details,change.state).correct);
 assert.equal(change.state.task.helped,false,'Wrong answers alone do not pretend help was used');
 f.input(Array.isArray(task.answer)?task.answer[0]:String(task.answer));f.submit();change=f.changes().at(-1);
 assert.equal(change.kind,'check');assert.equal(C.evaluate(a.taskSpec,change.details,change.state).complete,true);assert(change.state.task.status);
 const saved=copy(change.state);await f.hydrate(a.taskSpec,saved);assert(f.w.document.querySelector('[data-action="review-solution"]'));
 f.w.document.querySelector('[data-action="review-solution"]').click();change=f.changes().at(-1);assert(change.state.task.reviewedAfter);assert.equal(change.state.task.status,saved.task.status);assert.equal(change.state.task.helped,saved.task.helped);
 const beforeRepeat=copy(change.state);f.w.document.querySelector('[data-action="repeat"]').click();change=f.changes().at(-1);assert.equal(change.kind,'new-task');assert.deepEqual(change.state,beforeRepeat,'Repeating requests a new server attempt and preserves the completed old record');
 assert.equal(f.storageReads(),0);
});
test('revealed steps and sparse typed drafts remain serializable and cannot claim independent work',async t=>{
 const f=await fixture(t),task=tasks.find(x=>x.role==='learn'&&x.steps.length>1&&x.steps.every(s=>s.answerType!=='self-check'));
 const a=C.create(task.id,29);await f.hydrate(a.taskSpec,a.state);
 f.w.document.querySelector('[data-action="reveal-step"]').click();f.w.document.querySelector('[data-action="continue-step"]').click();
 f.input(String(Array.isArray(task.steps[1].answer)?task.steps[1].answer[0]:task.steps[1].answer));f.submit();
 const change=f.changes().at(-1);assert.equal(change.kind,'check');assert.equal(change.state.task.step,2);assert.equal(change.state.task.stepDrafts[0],'');assert(change.state.task.helped);C.normalize(a.taskSpec,change.state);
});
test('read-only work, stale handlers and wrong-origin hydration cannot alter a pupil attempt',async t=>{
 const f=await fixture(t),a=C.create(tasks[0].id,7);await f.hydrate(a.taskSpec,a.state,true);
 f.input('123');f.submit();assert.equal(f.changes().length,0);
 await f.hydrate(a.taskSpec,a.state,false);const stale=f.w.document.querySelector('#answer-form'),b=C.create(tasks[1].id,8);await f.hydrate(b.taskSpec,b.state);
 stale.dispatchEvent(new f.w.Event('submit',{bubbles:true,cancelable:true}));assert.equal(f.changes().length,0);
 await f.hydrate(a.taskSpec,a.state,false,{origin:'https://untrusted.example'});assert.equal(f.w.location.hash,b.state.route);
 f.w.location.hash='#unit/23';await tick();assert.equal(f.w.location.hash,b.state.route,'Managed task cannot turn into a different public exercise');
 assert.equal(f.storageReads(),0);
});
test('unverified source identity or forged completion fails closed during restoration',async t=>{
 const f=await fixture(t),a=C.create(tasks[0].id,9),bad=copy(a.taskSpec);bad.sourceRevision='0'.repeat(64);
 await f.hydrate(bad,a.state);assert.equal(f.messages.at(-1).message.payload.error,'RESTORE_FAILED');assert.equal(f.w.document.body.dataset.managedReadonly,'true');
});

test('manual criteria checked out of order serialize with false entries and restore after JSON round trip',async t=>{
 const f=await fixture(t),task=tasks.find(x=>x.role!=='learn'&&x.answerType==='self-check'&&x.selfCheck?.length>1),a=C.create(task.id,46);await f.hydrate(a.taskSpec,a.state);
 f.submit();let incomplete=f.changes().at(-1);assert.equal(incomplete.kind,'input');assert.equal(incomplete.state.task.status,'');C.normalize(a.taskSpec,incomplete.state,a.state);
 const checkbox=f.w.document.querySelectorAll('[data-criterion]')[1];checkbox.checked=true;checkbox.dispatchEvent(new f.w.Event('change',{bubbles:true}));
 const change=f.changes().at(-1),wire=JSON.parse(JSON.stringify(change.state));assert.equal(wire.task.manualChecks.final[0],false);assert.equal(wire.task.manualChecks.final[1],true);C.normalize(a.taskSpec,wire,a.state);await f.hydrate(a.taskSpec,wire);assert(!f.w.document.querySelectorAll('[data-criterion]')[0].checked);assert(f.w.document.querySelectorAll('[data-criterion]')[1].checked);
});

test('author LCM feedback distinguishes a larger common multiple and retains optional help after two errors',async t=>{
 const f=await fixture(t),task=tasks.find(item=>item.id==='v6-author-lcm-example-01-chain'),a=C.create(task.id,41);
 await f.hydrate(a.taskSpec,a.state);
 assert.match(f.w.document.querySelector('.source').textContent,/Авторское дополнение/);
 assert.equal(f.w.document.querySelector('.source a'),null,'Author task must not link to an invented textbook page');
 f.input('24');f.submit();
 assert.match(f.w.document.querySelector('.feedback').textContent,/общее кратное, но есть меньшее/);
 assert.equal(f.w.document.querySelector('.hint'),null);
 f.input('48');f.submit();
 const wrong=f.changes().at(-1).state;
 assert.equal(wrong.task.step,0);assert.equal(wrong.task.helped,false);assert.equal(wrong.task.wrongCounts[0],2);
 assert.match(f.w.document.querySelector('.feedback').textContent,/Хочешь подсказку/);
 assert.equal(f.w.document.querySelector('.hint'),null,'Two errors offer, but do not automatically open, help');
 f.w.document.querySelector('[data-action="hint"]').click();
 f.w.document.querySelector('[data-action="hint"]').click();
 const hidden=f.changes().at(-1).state;C.normalize(a.taskSpec,hidden,wrong);
 assert.equal(hidden.task.helped,true);assert.deepEqual(hidden.task.hintKeys,[0]);assert.deepEqual(hidden.task.hiddenHints,[0]);
 await f.hydrate(a.taskSpec,hidden);assert.equal(f.w.document.querySelector('#answer').value,'48');assert.equal(f.w.document.querySelector('.hint'),null);
 f.input('12');f.submit();const next=f.changes().at(-1).state;
 assert.equal(next.task.step,1);assert.equal(next.task.stepDrafts[0],'12');assert.equal(next.task.helped,true);
 assert.match(f.w.document.querySelector('.entry-label').textContent,/НОК\(12, 8\)/);
 assert.equal(f.w.document.querySelectorAll('.step-history li').length,1);
 const work=f.w.document.querySelector('.work');assert(work.querySelector('#answer-form').compareDocumentPosition(work.querySelector('.step-history'))&f.w.Node.DOCUMENT_POSITION_FOLLOWING,'Current action precedes retained history');
});

test('larger-multiple feedback applies to the final LCM, not a prime multiplicity question',async t=>{
 const f=await fixture(t),check=tasks.find(item=>item.id==='v6-author-lcm-check-02-factors'),a=C.create(check.id,42);
 await f.hydrate(a.taskSpec,a.state);f.input('72');f.submit();
 assert.match(f.w.document.querySelector('.feedback').textContent,/общее кратное, но есть меньшее/);
 assert.equal(f.changes().at(-1).state.task.status,'');
 const example=tasks.find(item=>item.id==='v6-author-lcm-example-01-factors'),b=C.create(example.id,43);
 await f.hydrate(b.taskSpec,b.state);
 for(const step of example.steps.slice(0,3)){f.input(String(step.answer));f.submit();}
 assert.match(f.w.document.querySelector('.entry-label').textContent,/Сколько множителей 2/);
 f.input('6');f.submit();
 assert.doesNotMatch(f.w.document.querySelector('.feedback').textContent,/общее кратное/);
 assert.equal(f.changes().at(-1).state.task.step,3);
});
