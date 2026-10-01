// Backup and restoration safety gate. Uses jsdom, not a visual-browser substitute.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const {JSDOM,VirtualConsole}=createRequire(import.meta.url)('jsdom');
const read=p=>fs.readFileSync(p,'utf8'),ctx=vm.createContext({TextEncoder});
for(const file of ['foundation-reference','course-state','backup'])vm.runInContext(read('ege-baza/'+file+'.js'),ctx);
const core=ctx.EgeBazaBackup,api=ctx.EgeBazaCourseState,tasks=ctx.EgeBazaFoundationReference.tasks;
const blank=()=>({v:1,practice:{},runs:{}}),clone=x=>JSON.parse(JSON.stringify(x));
let checks=0;const ok=(x,m)=>{assert.ok(x,m);checks++;};
const equal=(x,y,m)=>{assert.deepEqual(JSON.parse(JSON.stringify(x)),JSON.parse(JSON.stringify(y)),m);checks++;};
const throws=(fn,m)=>{assert.throws(fn,undefined,m);checks++;};
function storage(raw=null){const values=new Map([['unrelated-course','leave-this']]);if(raw!==null)values.set(core.KEY,raw);return {values,writes:0,getItem(k){return values.get(k)??null;},setItem(k,v){this.writes++;values.set(k,v);},removeItem(k){values.delete(k);}};}
const timestamp=Date.now()-2*api.DAY;
function run(phase,helped=false){return {answers:Object.fromEntries(tasks.filter(t=>t.phase===phase).map(t=>[t.id,String(t.answer)])),finishedAt:timestamp,helped};}
function fixture(){const s=blank();tasks.filter(t=>t.phase==='practice').forEach((t,i)=>s.practice[t.id]={tries:i%2?2:1,hints:i===0,solution:i===1,answer:String(t.answer),done:true});s.runs.diagnostic=run('diagnostic');s.runs.diagnostic.answers[tasks.find(t=>t.phase==='diagnostic').id]=null;s.runs.checkpoint=run('checkpoint',true);s.runs.repeat={answers:{},finishedAt:null,helped:false};return s;}
let state=fixture(),source=storage(JSON.stringify(state));
const exported=core.exportBackup(source,new Date(timestamp)),envelope=JSON.parse(exported);
ok(source.writes===0,'Export never writes');equal(core.decode(exported).modules.m01.state,state,'All allowed history survives encoding');
const target=storage();let candidate=core.preview(exported,target);
ok(target.writes===0&&candidate.current.status==='empty','Preview does not write');
const restored=core.restore(candidate,target);equal(JSON.parse(target.getItem(core.KEY)),state,'Round-trip exact state');
ok(target.getItem('unrelated-course')==='leave-this'&&target.writes===1,'Exactly one allowed write');
ok(restored.independent===11&&restored.confirmed===0,'Help and prior tries remain non-independent');
ok(restored.runs.diagnostic.correct===11&&restored.runs.checkpoint.helped,'Skipped answers and support preserved');
ok(restored.repeatAt===timestamp+api.DAY&&restored.repeatReady,'Repeat availability unchanged');
ok(api.recommend(restored).hash==='#test-repeat','Restored partial repeat resumes');
state=blank();const d=tasks.filter(t=>t.phase==='diagnostic');state.runs.diagnostic={answers:{[d[0].id]:'999',[d[1].id]:null},finishedAt:null,helped:true};
const partial=core.exportBackup(storage(JSON.stringify(state))),summary=core.preview(partial,target).incoming;
ok(summary.runs.diagnostic.count===2&&summary.runs.diagnostic.correct===null,'Partial assessment stays ungraded');
ok(api.recommend(summary).hash==='#test-diagnostic','Partial diagnostic resumes');
const mutate=fn=>{const b=clone(envelope);fn(b);return JSON.stringify(b);};
for(const invalid of ['{bad','null','[]','{}',mutate(b=>b.version=2),mutate(b=>b.format='another-course'),mutate(b=>b.modules.m02=b.modules.m01),mutate(b=>b.modules.m01.bankVersion=2),mutate(b=>b.exportedAt='yesterday'),mutate(b=>b.modules.m01.state.v=2),mutate(b=>b.modules.m01.state.practice.unknown={}),mutate(b=>b.modules.m01.state.score=100)])throws(()=>core.preview(invalid,target),'Invalid envelope cannot preview');
const p=tasks.find(t=>t.phase==='practice');
for(const edit of [r=>r.tries=-1,r=>r.tries=1.5,r=>r.tries=100001,r=>r.hints='false',r=>r.answer='999',r=>r.answer='<img>',r=>r.answer='9'.repeat(121)]){
 throws(()=>core.decode(mutate(b=>edit(b.modules.m01.state.practice[p.id]))),'Invalid practice record');
}
throws(()=>core.decode(mutate(b=>{b.modules.m01.state.runs.diagnostic.answers[d[1].id]=null;delete b.modules.m01.state.runs.diagnostic.answers[d[0].id];})),'Gap rejected');
throws(()=>core.decode(mutate(b=>b.modules.m01.state.runs.diagnostic.finishedAt=null)),'Complete without timestamp rejected');
throws(()=>core.decode(mutate(b=>b.modules.m01.state.runs.repeat.finishedAt=timestamp)),'Partial cannot be finished');
throws(()=>core.decode(mutate(b=>b.modules.m01.state.runs.diagnostic.finishedAt=1e20)),'Out-of-range timestamp rejected');
throws(()=>core.decode(' '.repeat(core.MAX_BYTES+1)),'Size checked before parsing');
throws(()=>core.decode('{"__proto__":{},"format":"x"}'),'Prototype fields rejected');
throws(()=>core.exportBackup(storage()),'Empty browser has no pretend backup');
throws(()=>core.exportBackup(storage('{broken')),'Corrupt export not silently repaired');
const damaged=storage('{broken'),recovery=core.preview(exported,damaged);ok(recovery.current.status==='unreadable','Corrupt current data visible');core.restore(recovery,damaged);ok(core.summary(damaged.getItem(core.KEY)).solved===24,'Explicit recovery from corrupt current storage');
candidate=core.preview(exported,target);target.values.set(core.KEY,JSON.stringify(blank()));const changed=target.getItem(core.KEY),count=target.writes;
throws(()=>core.restore(candidate,target),'Preview stale after another tab writes');ok(target.getItem(core.KEY)===changed&&target.writes===count,'Stale preview leaves new work intact');
const quota=storage(changed);candidate=core.preview(exported,quota);quota.setItem=()=>{throw Error('quota');};throws(()=>core.restore(candidate,quota),'Quota failure reported');ok(quota.getItem(core.KEY)===changed,'Quota failure preserves old state');
const denied={getItem(){throw Error('denied');},setItem(){throw Error('must not write');}};throws(()=>core.preview(exported,denied),'Denied storage prevents preview');
const tampered={...core.preview(exported,target),after:'{"v":5}'};throws(()=>core.restore(tampered,target),'Revalidate at write boundary');

let dom,w,current,downloads,blobs,errors=[],writes;
const tick=()=>new Promise(r=>setTimeout(r,15));const q=s=>w.document.querySelector(s);
function boot(raw=null){
 dom?.window.close();current=storage(raw);downloads=[];blobs=[];writes=0;
 const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 dom=new JSDOM(read('ege-baza/index.html'),{url:'https://example.test/ege-baza/#backup',runScripts:'outside-only',virtualConsole:vc});w=dom.window;
 w.TextEncoder=TextEncoder;w.HTMLElement.prototype.scrollIntoView=()=>{};
 w.Storage.prototype.getItem=k=>current.getItem(k);w.Storage.prototype.setItem=(k,v)=>{writes++;current.setItem(k,v);};
 w.URL.createObjectURL=blob=>{blobs.push(blob);return 'blob:test';};w.URL.revokeObjectURL=()=>{};
 w.HTMLAnchorElement.prototype.click=function(){if(this.download)downloads.push(this.download);};
 for(const f of ['registry','foundation-reference','course-state','backup','backup-ui','app'])w.eval(read('ege-baza/'+f+'.js'));
}
async function select(text){const file=new w.File([text],'copy.json',{type:'application/json'});Object.defineProperty(q('#backup-file'),'files',{value:[file],configurable:true});q('#backup-file').dispatchEvent(new w.Event('change',{bubbles:true}));await tick();await tick();}
async function click(selector){assert.ok(q(selector),selector);q(selector).click();await tick();}
try{
 boot(JSON.stringify(blank()));ok(q('h1').textContent==='Резервная копия','Backup route loads');
 await select(exported);ok(!q('#backup-preview').hidden&&q('[data-backup-apply]').disabled&&writes===0,'File preview requires consent, no write');
 ok(q('#backup-preview').textContent.includes('с обращением к обучению'),'Preview includes assessment support');
 await click('[data-backup-cancel]');ok(q('#backup-preview').hidden&&writes===0,'Cancel preserves state');
 await select(exported);await click('#backup-consent');ok(!q('[data-backup-apply]').disabled,'Explicit consent enables import');
 await click('[data-backup-apply]');ok(writes===1&&q('#backup-status').textContent.includes('Копия восстановлена'),'Confirmed import succeeds');equal(JSON.parse(current.getItem(core.KEY)),fixture(),'UI import preserves fixture');
 await click('[data-backup-export]');ok(downloads[0]?.endsWith('.json')&&blobs[0].type==='application/json;charset=utf-8','Download has JSON type and filename');
 await select('{bad');ok(q('#backup-preview').hidden&&q('#backup-status').textContent.includes('JSON')&&writes===1,'Bad file cannot keep old apply action');
 await select(exported);current.values.set(core.KEY,JSON.stringify(blank()));w.dispatchEvent(new w.StorageEvent('storage',{key:core.KEY}));ok(q('#backup-preview').hidden&&q('#backup-status').textContent.includes('другой вкладке'),'Storage event invalidates preview');
 await select(exported);await click('#backup-consent');current.values.set(core.KEY,'{changed');await click('[data-backup-apply]');ok(current.getItem(core.KEY)==='{changed'&&q('#backup-status').textContent.includes('изменился'),'Final apply detects change even without event');
 boot('{broken');await select(exported);ok(q('[data-backup-current]').textContent.includes('исходное'),'Damaged current work can be saved as raw text');await click('[data-backup-current]');ok(downloads[0].endsWith('.txt'),'Raw recovery copy downloaded');
 boot(JSON.stringify(blank()));await select(exported);await click('#backup-consent');w.Storage.prototype.setItem=()=>{throw Error('quota');};await click('[data-backup-apply]');ok(q('#backup-status').textContent.includes('Прежнее сохранение не заменено')&&current.getItem(core.KEY)===JSON.stringify(blank()),'UI quota failure is honest');
 boot(JSON.stringify(blank()));await select(exported);w.location.hash='#map';await tick();w.dispatchEvent(new w.StorageEvent('storage',{key:core.KEY}));ok(q('[data-module]')&&errors.length===0,'Leaving backup disposes events');
 // A restored partial assessment resumes in the authoritative module.
 dom.window.close();const moduleSource=read('trainers/ege-baza/course/index.html');
 const rawPartial=JSON.stringify(core.decode(partial).modules.m01.state);
 dom=new JSDOM(moduleSource,{url:'https://example.test/trainers/ege-baza/course/#test-diagnostic',runScripts:'dangerously',virtualConsole:new VirtualConsole(),beforeParse(win){win.scrollTo=()=>{};win.HTMLElement.prototype.scrollIntoView=()=>{};win.localStorage.setItem(core.KEY,rawPartial);}});w=dom.window;await tick();
 ok(q('h2').textContent==='Задание 3 из 12','Module resumes restored diagnostic at actual next task');
 ok(w.MathExamFoundation.result('diagnostic').helped,'Restored assistance survives authoritative load');
 // A stale form may not replace a newer restored state, even if event delivery is late.
 const fresh=JSON.stringify(fixture());w.localStorage.setItem(core.KEY,fresh);q('#answer').value='123';q('#answer-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 ok(w.localStorage.getItem(core.KEY)===fresh,'Stale form does not overwrite restored progress');
 ok(q('#storage-warning').textContent.includes('изменилось'),'Stale action is explained');
 w.localStorage.removeItem(core.KEY);w.dispatchEvent(new w.StorageEvent('storage',{key:null}));ok(w.MathExamFoundation.result('diagnostic').finished===false,'Storage clear invalidates in-memory result');
 // Failure to read the current state must not allow a blind write or reset.
 w.location.hash='#practice-decimal-0';await tick();
 let blindWrites=0;w.Storage.prototype.getItem=()=>{throw Error('read denied');};w.Storage.prototype.setItem=()=>{blindWrites++;};
 q('#answer').value='0.75';q('#answer-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 ok(blindWrites===0&&q('#storage-warning').textContent.includes('не разрешил'),'No blind write after read failure');
 w.location.hash='#report';await tick();q('[data-action="reset-ask"]').click();
 let removed=false;w.Storage.prototype.removeItem=()=>{removed=true;};q('[data-action="reset-confirm"]').click();
 ok(!removed&&q('#storage-warning').textContent.includes('Не удалось удалить'),'No blind reset after read failure');
 ok(errors.length===0,'No navigator runtime errors');
 console.log(`EGE_BAZA_BACKUP_OK: ${checks} validation/round-trip/conflict/DOM checks. Real download/upload gate separate.`);
}finally{dom?.window.close();}
