'use strict';
// In-memory DOM contracts; visual browser review is recorded separately.
const {JSDOM}=require('jsdom'),fs=require('node:fs'),assert=require('node:assert/strict');
function boot(saved){const dom=new JSDOM(fs.readFileSync(__dirname+'/index.html','utf8'),{url:'https://makarychev.test/',runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;w.scrollTo=()=>{};const errors=[];w.console.error=(...args)=>errors.push(args.join(' '));if(saved)w.localStorage.setItem('mathexam.makarychev8.2024.v1',saved);for(const file of ['../peterson6/math.js','task-graphs.js','check.js','models.js','data.js','app.js'])w.eval(fs.readFileSync(__dirname+'/'+file,'utf8'));return {w,d:w.document,errors};}
async function exerciseRange(first, end, checkNavigation){
const {w,d,errors}=boot(),api=w.MakarychevApp;
const nav=hash=>{w.history.replaceState(null,'',hash);api.route();};
const click=s=>{const el=d.querySelector(s);assert(el,'Missing '+s);el.click();};
const input=(s,v)=>{const el=d.querySelector(s);assert(el,'Missing '+s);el.value=v;el.dispatchEvent(new w.Event('input',{bubbles:true}));};
const submit=s=>{const el=d.querySelector(s);assert(el,'Missing '+s);el.dispatchEvent(new w.Event('submit',{cancelable:true,bubbles:true}));};
const state=()=>api.getState();
assert(d.querySelector('h1').textContent.includes('Разобраться'));assert(api.format('{{frac:3^(n+2):3^n}}').includes('<sup>n+2</sup>'));assert(api.format('{{frac:3^(n+2):3^n}}').includes('<sup>n</sup>'));assert(!api.format('<img src=x onerror=alert(1)>').includes('<img')); let renders=0,walkedSteps=0,position=0;const visited=[];
for(const l of w.MakarychevCourse.lessons){for(let i=0;i<l.tasks.length;i++){
 const current=position++;
 if(current<first || current>=end)continue;
 const t=l.tasks[i];visited.push(t);nav('#lesson/'+l.id+'/'+i);assert(d.querySelector('.prompt'),t.id);assert(!d.querySelector('.error-page'));assert(d.querySelector('#model').textContent.trim(),l.id+' model');assert(d.querySelector('.answer-form label').textContent.trim());
 click('[data-action="guided"]');
 for(let k=0;k<t.steps.length;k++){input('[data-step-input="'+k+'"]',t.steps[k].answer);submit('[data-step-form="'+k+'"]');assert.equal(state().tasks[t.id].step,k+1,t.id+' step '+k);assert.equal(d.querySelectorAll('.step.completed').length,k+1);walkedSteps++;}
 if(t.kind==='choice')click('[data-choice="'+t.choices.indexOf(t.answer)+'"]');else input('#final-answer',t.answer);submit('#answer-form');assert(state().tasks[t.id].correct,t.id);assert(!state().tasks[t.id].independent,t.id+' helped');renders++;
 // Yield so jsdom can dispose of render trees replaced by the answer form.
 await new Promise(resolve=>setImmediate(resolve));
 }}
assert.equal(renders,end-first,'every assigned card rendered');
// A child reopens the complete set of work it actually entered in this browser session.
const stored=w.localStorage.getItem('mathexam.makarychev8.2024.v1');
const reopened=boot(stored);
const restored=reopened.w.MakarychevApp.getState().tasks;
for(const t of visited){
 const rec=restored[t.id];
 assert(rec?.correct && rec.assisted && !rec.independent,t.id+' retained assisted result');
 assert.equal(rec.step,t.steps.length,t.id+' retained step count');
}
assert.deepEqual(reopened.errors,[]);reopened.w.close();
if(checkNavigation){
// Draft, completed step and notebook survive detour and reload.
const lesson=w.MakarychevCourse.lessons.find(l=>l.tasks.some(t=>t.kind!=='choice'&&t.skills.length));const index=lesson.tasks.findIndex(t=>t.kind!=='choice'&&t.skills.length),task=lesson.tasks[index],route='#lesson/'+lesson.id+'/'+index;
nav(route);input('#notebook','Проверка сохранения записей');const old=state().tasks[task.id];click('[data-action="detour"]');assert(state().origin);nav(w.location.hash);assert(d.querySelector('.return-banner'));click('[data-action="new"]');click('[data-action="return"]');nav(w.location.hash);assert.equal(d.querySelector('#notebook').value,'Проверка сохранения записей');assert.equal(state().tasks[task.id].step,old.step);
const saved=w.localStorage.getItem('mathexam.makarychev8.2024.v1'),reloaded=boot(saved);assert.equal(reloaded.w.MakarychevApp.getState().tasks[task.id].note,'Проверка сохранения записей');assert.equal(reloaded.errors.length,0);reloaded.w.close();
// Index search endpoints and actual solution links.
for(const n of [1,500,1271,1340]){nav('#home');input('#exercise-number',String(n));submit('#number-form');assert(d.querySelector('#number-result').textContent.includes('№ '+n));}
const source=w.MakarychevCourse.lessons.flatMap(l=>l.tasks).find(t=>t.source.type==='textbook'),n=/№\s*(\d+)/.exec(source.source.reference)[1];nav('#home');input('#exercise-number',n);submit('#number-form');assert(d.querySelector('#number-result a.button:not(.quiet)'),'source solution link');
for(const hash of ['#lesson/unknown','#lesson/p01/9999','#practice/unknown/1','#skills','#progress','#home']){nav(hash);assert(!d.querySelector('.error-page'),hash);}
assert.deepEqual(errors,[]);
const malformed=boot('{bad');assert(!malformed.d.querySelector('#storage-warning').hidden);assert.equal(malformed.w.localStorage.getItem('mathexam.makarychev8.2024.v1'),'{bad');malformed.w.close();
 }
assert.deepEqual(errors,[]);
w.close();
console.log(JSON.stringify({renders,walkedSteps}));
}
function inventory(){
 const scope={window:{}};
 require('node:vm').runInNewContext(fs.readFileSync(__dirname+'/data.js','utf8'),scope);
 return scope.window.MakarychevCourse.lessons.flatMap(lesson=>lesson.tasks);
}
function run(){
 const args=process.argv.slice(2);
 if(args[0]==='--range'){
   const first=Number(args[1]),end=Number(args[2]);
   assert(Number.isSafeInteger(first)&&first>=0&&Number.isSafeInteger(end)&&end>first&&args.length===4);
   return exerciseRange(first,end,args[3]==='navigation');
 }
 const tasks=inventory();
 const total=Number(process.env.M8_UI_SHARD_COUNT||1),index=Number(process.env.M8_UI_SHARD_INDEX||0);
 assert(Number.isSafeInteger(total)&&total>=1&&total<=tasks.length);
 assert(Number.isSafeInteger(index)&&index>=0&&index<total);
 const start=Math.floor(tasks.length*index/total),stop=Math.floor(tasks.length*(index+1)/total);
 const expectedSteps=tasks.slice(start,stop).reduce((sum,t)=>sum+t.steps.length,0);
 const {spawnSync}=require('node:child_process');
 let rendered=0,steps=0;
 for(let first=start;first<stop;first+=12){
   const end=Math.min(first+12,stop);
   const result=spawnSync(process.execPath,[...process.execArgv,__filename,'--range',String(first),String(end),first===start?'navigation':'walk'],{encoding:'utf8'});
   if(result.error)throw result.error;
   assert.equal(result.status,0,'DOM range '+first+'–'+end+' failed: '+(result.stderr||result.signal||''));
   const pass=JSON.parse(result.stdout);
   assert.equal(pass.renders,end-first);
   rendered+=pass.renders;steps+=pass.walkedSteps;
   console.log('Verified '+rendered+' of '+(stop-start)+' cards in partition '+(index+1)+'/'+total);
 }
 assert.equal(rendered,stop-start);assert.equal(steps,expectedSteps);
 console.log(JSON.stringify({status:'PASS',renders:rendered,walkedSteps:steps,first:start,end:stop,bank:tasks.length,
   flows:['every task and step','retained guided work for every visited card','sticky assistance','detour return','notebook reload','source-map boundaries','invalid routes','corrupt storage preserved']}));
}
Promise.resolve().then(run).catch(error=>{console.error(error);process.exitCode=1;});
