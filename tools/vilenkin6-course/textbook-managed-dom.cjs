'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'../..'),base=path.join(root,'courses/vilenkin-6-part-1');
const C=require(path.join(base,'textbook-learning-contracts'));
const units=['A','B','C','D'].flatMap(name=>JSON.parse(fs.readFileSync(path.join(base,'textbook-data/units-'+name+'.json'),'utf8')));
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

test('All topics requests the owning catalogue without changing the task or accepting stale controls',async t=>{
 const f=await fixture(t),a=C.create(tasks[0].id,31);await f.hydrate(a.taskSpec,a.state);
 f.input('unfinished');const saved=copy(f.changes().at(-1).state);
 const link=f.w.document.querySelector('[data-managed-course-catalog]');assert(link);assert.equal(link.getAttribute('href'),'#');
 link.click();const change=f.changes().at(-1);
 assert.equal(change.kind,'navigate');assert.deepEqual(change.details,{target:'vilenkin-textbook-catalog'});
 assert.deepEqual(change.state,saved);assert.equal(f.w.location.hash,a.state.route);
 const count=f.changes().length,b=C.create(tasks[1].id,32);await f.hydrate(b.taskSpec,b.state);
 link.click();assert.equal(f.changes().length,count,'Detached catalogue link cannot leave the next task');
 await f.hydrate(b.taskSpec,b.state,true);
 f.w.document.querySelector('[data-managed-course-catalog]').click();assert.equal(f.changes().length,count,'Read-only bridge retains its navigation guard');
 assert.equal(f.storageReads(),0);
});

test('manual criteria checked out of order serialize with false entries and restore after JSON round trip',async t=>{
 const f=await fixture(t),task=tasks.find(x=>x.role!=='learn'&&x.answerType==='self-check'&&x.selfCheck?.length>1),a=C.create(task.id,46);await f.hydrate(a.taskSpec,a.state);
 f.submit();let incomplete=f.changes().at(-1);assert.equal(incomplete.kind,'input');assert.equal(incomplete.state.task.status,'');C.normalize(a.taskSpec,incomplete.state,a.state);
 const checkbox=f.w.document.querySelectorAll('[data-criterion]')[1];checkbox.checked=true;checkbox.dispatchEvent(new f.w.Event('change',{bubbles:true}));
 const change=f.changes().at(-1),wire=JSON.parse(JSON.stringify(change.state));assert.equal(wire.task.manualChecks.final[0],false);assert.equal(wire.task.manualChecks.final[1],true);C.normalize(a.taskSpec,wire,a.state);await f.hydrate(a.taskSpec,wire);assert(!f.w.document.querySelectorAll('[data-criterion]')[0].checked);assert(f.w.document.querySelectorAll('[data-criterion]')[1].checked);
});
