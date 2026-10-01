// Read-only adapter and DOM gate. Visual/real-browser checks are separate.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const {JSDOM,VirtualConsole}=createRequire(import.meta.url)('jsdom');
const read=p=>fs.readFileSync(p,'utf8');
let checks=0;
const ok=(value,message)=>{assert.ok(value,message);checks++;};
const equal=(a,b,message)=>{assert.equal(JSON.stringify(a),JSON.stringify(b),message);checks++;};
const ctx=vm.createContext({});
for(const file of ['registry','foundation-reference','course-state'])vm.runInContext(read('ege-baza/'+file+'.js'),ctx);
const registry=ctx.EgeBazaRegistry, api=ctx.EgeBazaCourseState, tasks=ctx.EgeBazaFoundationReference.tasks;
const original=read('trainers/ege-baza/course/index.html');
const data=original.split('/*__FOUNDATION_DATA_START__*/')[1].split('/*__FOUNDATION_DATA_END__*/')[0];
const moduleData=vm.runInNewContext(data+';({skills:SKILLS.map(s=>s.id),tasks:TASKS.map(({id,skill,phase,answer})=>({id,skill,phase,answer}))})');
equal(ctx.EgeBazaFoundationReference,moduleData,'Read-only mirror matches authoritative module');
const all=registry.modules.flatMap(m=>m.lessons),ids=[...registry.modules,...all,...registry.prerequisites].map(x=>x.id);
ok(new Set(ids).size===ids.length,'Unique registry IDs');
ok(all.length===32&&all.filter(l=>l.href).length===6,'32 outlines; exactly six prototype lessons');
equal(registry.modules.slice(0,6).flatMap(m=>m.positions).sort((a,b)=>a-b),Array.from({length:21},(_,i)=>i+1),'Every position exactly once in main modules');
const lessonMap=new Map(all.map(l=>[l.id,l])), visited=new Set();
function walk(id,stack=new Set()){
 ok(ids.includes(id),'Known prerequisite '+id);ok(!stack.has(id),'Acyclic prerequisite '+id);
 if(visited.has(id))return;const next=new Set(stack).add(id);
 for(const p of lessonMap.get(id)?.prerequisites||[])walk(p,next);visited.add(id);
}
for(const l of all)walk(l.id);
for(const item of [...all.filter(l=>l.href),...registry.prerequisites]){
 let file=path.resolve('ege-baza',item.href.split('#')[0]);if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 ok(fs.existsSync(file),'Real destination '+item.id);
}
ok(original.includes('href="../../../ege-baza/#map"'),'Return link exists');
const empty=()=>({v:1,practice:{},runs:{}}), time=2000000000000;
const snap=raw=>api.snapshot(raw===null?null:typeof raw==='string'?raw:JSON.stringify(raw),time);
const fullRun=(phase,at=time,helped=false)=>({answers:Object.fromEntries(tasks.filter(t=>t.phase===phase).map(t=>[t.id,String(t.answer)])),finishedAt:at,helped});
const practice=(raw,t,extra={})=>raw.practice[t.id]={tries:1,answer:String(t.answer),done:true,hints:false,solution:false,...extra};
let raw=empty(),state=snap(null);
ok(state.status==='empty'&&state.solved===0&&state.confirmed===0,'No invented progress');
ok(api.recommend(state).kind==='diagnostic','Empty starts diagnostic');
for(const invalid of ['{bad','null','[]','{"v":2}','"<script>"'])ok(snap(invalid).status==='unreadable','Malformed state safe');
const diagTasks=tasks.filter(t=>t.phase==='diagnostic');
raw.runs.diagnostic={answers:{[diagTasks[0].id]:'999',[diagTasks[1].id]:null},finishedAt:time};state=snap(raw);
ok(!state.runs.diagnostic.finished&&state.runs.diagnostic.count===2&&state.runs.diagnostic.correct===null,'Incomplete assessment has no score despite timestamp');
ok(state.runs.diagnostic.answers===null&&api.recommend(state).hash==='#test-diagnostic','No answer leakage; resume unfinished diagnostic');
raw.runs.diagnostic={answers:{[diagTasks[1].id]:'0.25'}};
ok(snap(raw).runs.diagnostic.count===0,'Noncontiguous answers rejected');
raw.runs.diagnostic=fullRun('diagnostic');state=snap(raw);
ok(state.confirmed===0&&state.runs.diagnostic.correct===12,'Diagnostic grants no mastery');
ok(api.recommend(state).kind==='learn','Finished diagnostic recommends lesson');
const p=tasks.filter(t=>t.phase==='practice');practice(raw,p[0],{hints:true});practice(raw,p[1],{tries:2});practice(raw,p[2],{solution:true});
state=snap(raw);ok(state.solved===3&&state.independent===0&&state.skills[0].level===1,'Hints, solutions, corrections never independent');
ok(api.recommend(state).hash==='#practice-decimal-3','Continue first unfinished practice');
practice(raw,p[3],{answer:'999'});ok(snap(raw).solved===3,'Forged done does not earn credit');
for(const t of p)practice(raw,t);state=snap(raw);
ok(state.solved===24&&state.independent===24&&state.confirmed===0,'Practice distinguished from checks');
ok(api.recommend(state).kind==='checkpoint','Complete practice leads to checkpoint');
raw.runs.checkpoint=fullRun('checkpoint');state=snap(raw);
ok(state.confirmed===6&&!state.repeatReady&&api.recommend(state).kind==='wait','Checkpoint confirms; repeat still locked');
ok(!api.snapshot(JSON.stringify(raw),time+api.DAY-1).repeatReady,'Locked just before 24h');
ok(api.recommend(api.snapshot(JSON.stringify(raw),time+api.DAY)).kind==='repeat','Open at exactly 24h');
raw.runs.checkpoint.helped=true;ok(snap(raw).confirmed===0,'Assisted checkpoint no mastery');
raw.runs.checkpoint.finishedAt=time-api.DAY;raw.runs.repeat={answers:{}};state=snap(raw);
ok(api.recommend(state).hash==='#test-repeat','Resume available unfinished repeat');
raw.runs.repeat=fullRun('repeat');state=snap(raw);
ok(state.skills.every(s=>s.level===4)&&api.recommend(state).kind==='report','Independent repeat confirms and opens report');
raw.runs.repeat.helped=true;ok(snap(raw).confirmed===0,'Assisted repeat no mastery');
raw=empty();raw.runs.diagnostic=fullRun('diagnostic');raw.runs.diagnostic.answers[diagTasks[0].id]=null;
ok(snap(raw).runs.diagnostic.correct===11,'Skipped answer is wrong');
raw.runs.diagnostic.finishedAt=-1;ok(!snap(raw).runs.diagnostic.finished,'Invalid finish timestamp rejected');

let dom,w,stored,writes=0;const errors=[];
const scripts=['registry','foundation-reference','course-state','app'].map(f=>read('ege-baza/'+f+'.js'));
const tick=()=>new Promise(r=>setTimeout(r,10));
const q=s=>w.document.querySelector(s),text=()=>q('#content').textContent;
function boot(value=null,hash='#today',blocked=false){
 dom?.window.close();stored=value;
 const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 dom=new JSDOM(read('ege-baza/index.html'),{url:'https://example.test/ege-baza/'+hash,runScripts:'outside-only',virtualConsole:vc});w=dom.window;
 w.HTMLElement.prototype.scrollIntoView=()=>{};
 w.Storage.prototype.getItem=key=>{assert.equal(key,api.KEY);if(blocked)throw Error('denied');return stored;};
 for(const method of ['setItem','removeItem','clear'])w.Storage.prototype[method]=()=>{writes++;throw Error('Navigator may not write storage');};
 for(const s of scripts)w.eval(s);
}
async function go(hash){w.location.hash=hash;await tick();}
async function click(selector){assert.ok(q(selector),selector);q(selector).click();await tick();}
try{
 boot();ok(q('[data-recommendation="diagnostic"]'),'Today real entry action');
 await click('[data-nav="map"]');ok(q('[data-nav="map"]').getAttribute('aria-current')==='page','Active navigation');
 ok(w.document.activeElement===q('#content'),'Route change focuses main');
 ok(w.document.querySelectorAll('[data-module]').length===7,'All modules rendered');
 await click('[data-module="m02"] a');ok(text().includes('Эти уроки ещё готовятся'),'Planned module clearly labelled');
 ok(w.document.querySelectorAll('.lesson a.btn').length===0,'No fake planned lesson launch');
 await go('#module?module=m01');ok(w.document.querySelectorAll('.lesson a.btn').length===6,'Six real lessons');
 await click('a[href="#foundation?skill=p-fraction&from=m01"]');ok(q('[data-resource]').dataset.resource==='p-fraction','Requested prerequisite first');
 ok(q('.back').getAttribute('href')==='#module?module=m01','Return to originating module');
 ok(q('[data-resource] .btn').target==='_blank'&&text().includes('пока не прибавляются'),'Standalone resource opens separately, no course credit');
 await click('.back');ok(text().includes('Числа, деньги'),'Return route works');
 await go('#module?module=missing');ok(text().includes('Раздел не найден'),'Unknown module usable fallback');
 await go('#module?module=m03&lesson=m03-powers');ok(q('.lesson.selected').id==='m03-powers','Prerequisite lesson selected');
 await go('#progress');ok(text().includes('Пока нет сохранённой работы'),'Empty progress explicit');
 await click('[data-refresh]');ok(q('#refresh-status').textContent==='Результаты обновлены.','Manual refresh announced');
 await click('.skip');ok(w.location.hash==='#progress'&&w.document.activeElement===q('#content'),'Skip does not destroy route');
 raw=empty();practice(raw,p[0],{hints:true});stored=JSON.stringify(raw);
 w.dispatchEvent(new w.StorageEvent('storage',{key:api.KEY}));ok(q('[data-stat="solved"]').textContent.includes('1'),'Progress refreshes from another tab');
 ok(q('[data-stat="independent"]').textContent.trim().startsWith('0'),'Assistance displayed honestly');
 await go('#teacher');ok(text().includes('Общий журнал, назначения и резервная копия пока в плане'),'No invented teacher backend');
 const before=w.location.hash;await go('#map');w.history.back();await tick();await tick();ok(w.location.hash===before&&text().includes('Один учебный цикл'),'Browser history renders previous route');
 boot('{broken','#progress');ok(!q('#storage-notice').hidden,'Malformed notice');
 ok(!q('[data-stat]')&&text().includes('не означает'),'Unreadable progress not represented as zero');
 await go('#map');ok(w.document.querySelectorAll('[data-module]').length===7,'Malformed storage does not block navigation');
 boot(null,'#today',true);ok(!q('#storage-notice').hidden&&q('[data-recommendation="recovery"]'),'Storage denied, usable recovery');
 raw=empty();raw.runs.checkpoint={answers:{},finishedAt:null};practice(raw,p[0]);boot(JSON.stringify(raw));
 ok(q('[data-recommendation="resume"]'),'Unfinished test takes priority over lesson');
 await go('#progress');ok(q('[data-phase="checkpoint"]').textContent.includes('Не завершена'),'Unfinished score not shown');
 raw.practice[p[0].id].answer='<img src=x onerror=alert(1)>';boot(JSON.stringify(raw),'#progress');ok(!q('#content img'),'Stored answer cannot inject HTML');
 ok(writes===0,'All routes are read-only');ok(errors.length===0,'No DOM errors: '+errors.join('; '));
 console.log(`EGE_BAZA_NAVIGATOR_OK: ${checks} registry/state/DOM checks; no storage writes. Browser gate separate.`);
}finally{dom?.window.close();}
