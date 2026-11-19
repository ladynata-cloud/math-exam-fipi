'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'../..'),C=require('../../stereo-course/data/course.json'),T=require('../../stereo-course/assets/tasks.js'),A=require('../../stereo-course/assets/answer.js'),I=require('../../stereo-course/assets/investigations.js'),M=require('../../stereo-course/assets/investigation-models.js'),Store=require('../../stereo-course/assets/store.js');
const html=fs.readFileSync(root+'/stereo-course/index.html','utf8'),errors=[],KEY=Store.KEY;
let routes=0;
function boot(saved,hash=''){
 const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(html,{url:'https://example.test/stereo-course/index.html'+hash,runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
  w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
  // jsdom has no canvas painter. Only the preserved free-lab stage needs this
  // drawing sink; every new investigation and task uses the actual SVG engine.
  w.HTMLCanvasElement.prototype.getContext=function(){return new Proxy({canvas:this,measureText:s=>({width:String(s).length*8})},{get:(o,k)=>k in o?o[k]:()=>{}});};
  if(saved)w.localStorage.setItem(KEY,JSON.stringify(saved));
 }});return {dom,w:dom.window,d:dom.window.document,close:()=>dom.window.close()};
}
function click(x,s){const el=x.d.querySelector(s);assert.ok(el,s);el.click();return el;}
function input(x,s,value,type='input'){const el=x.d.querySelector(s);assert.ok(el,s);el.value=String(value);el.dispatchEvent(new x.w.Event(type,{bubbles:true}));return el;}
function submit(x,s){const el=x.d.querySelector(s);assert.ok(el,s);el.dispatchEvent(new x.w.Event('submit',{bubbles:true,cancelable:true}));}
function state(x,id){return JSON.parse(x.w.localStorage.getItem(KEY)).units[id];}
const plain=x=>JSON.parse(JSON.stringify(x)),tick=()=>new Promise(r=>setTimeout(r,8));
(async()=>{
 const x=boot();
 assert.equal(x.d.querySelectorAll('.card').length,39);
 for(const [href,title]of [['textbook/','10–11'],['literacy/','Стереометрия с нуля'],['../geometry-course/index.html','7–9']])assert.ok([...x.d.querySelectorAll('.toplinks a')].some(a=>a.getAttribute('href')===href&&a.textContent.includes(title)),href);
 for(const u of C.units){
  click(x,'[data-unit="'+u.id+'"]');assert.equal(state(x,u.id).stage,6,u.id+' research first');assert.equal(state(x,u.id).practiceVersion,2);assert.ok(x.d.querySelector('[data-investigation-model] svg'),u.id+' actual initial geometry');assert.equal(x.d.querySelector('#answer'),null);assert.equal(x.d.querySelector('[data-investigation-observed]'),null,'prediction precedes readout');
  click(x,'[data-investigation-action=explore]');assert.match(x.d.querySelector('[data-investigation-feedback]').textContent,/Сначала выбери/);assert.equal(state(x,u.id).attempts,0);
  const spec=I.specs[u.id];input(x,'[data-investigation-prediction]',spec.correct,'change');click(x,'[data-investigation-action=explore]');assert.equal(state(x,u.id).investigation.firstPrediction,spec.correct);
  const geometry=x.d.querySelector('[data-investigation-model] svg').innerHTML;
  input(x,'[data-investigation-answer]',spec.answer,'change');submit(x,'[data-investigation-check]');assert.equal(state(x,u.id).investigation.attempts,0,'reading a conclusion before an action is not a completed investigation');
  const c=M.controls[u.id][0],value=c.value===c.min?c.max:c.min;input(x,'[data-investigation-control="'+c.key+'"]',value);assert.notEqual(x.d.querySelector('[data-investigation-model] svg').innerHTML,geometry,u.id+' real geometry update');assert.equal(state(x,u.id).investigation.changed,true);
  input(x,'[data-investigation-observation]','Изменил параметр '+c.key+'; сравнил конфигурации темы '+u.id+'.');input(x,'[data-investigation-answer]',(spec.answer+1)%spec.answers.length,'change');submit(x,'[data-investigation-check]');assert.equal(state(x,u.id).investigation.attempts,1);assert.equal(state(x,u.id).investigation.completed,false);
  click(x,'[data-investigation-action=hint]');assert.equal(state(x,u.id).investigation.helped,true);assert.equal(state(x,u.id).assisted,false,'research help does not assist a separate task');
  input(x,'[data-investigation-answer]',spec.answer,'change');submit(x,'[data-investigation-check]');assert.equal(state(x,u.id).investigation.completed,true);assert.equal(state(x,u.id).investigation.attempts,2);assert.equal(state(x,u.id).attempts,0);
  const recorded=state(x,u.id).investigation;
  click(x,'[data-investigation-action=explain]');assert.ok(x.d.querySelector('.topic-explanation'));click(x,'[data-stage="2"]');assert.equal(state(x,u.id).assisted,false,'general learning before opening a condition is not task help');click(x,'[data-stage="6"]');assert.equal(x.d.querySelector('[data-investigation-observation]').value,recorded.observation);assert.deepEqual(state(x,u.id).investigation.values,recorded.values);
  click(x,'[data-investigation-action=practice]');assert.ok(x.d.querySelector('#task-model svg'));const rec=state(x,u.id),task=T.make(u.task,rec.seed,rec.practiceVersion,u.id);assert.equal(rec.assisted,false);
  if(typeof task.a==='number')for(const bad of ['', '1+', '(1/0)^0', 'sqrt(-4)^0']){input(x,'#answer',bad);submit(x,'#answer-form');const now=state(x,u.id);assert.equal(now.attempts,0);assert.equal(now.checked,false);assert.equal(now.assisted,false);assert.equal(now.taskFirst.errors,0);}
  input(x,'#answer',A.format(task.a));submit(x,'#answer-form');assert.equal(state(x,u.id).independent,1,u.id+' independent after separate investigation');assert.equal(state(x,u.id).attempts,1);submit(x,'#answer-form');assert.equal(state(x,u.id).independent,1,'no duplicate credit');
  click(x,'[data-stage="6"]');assert.equal(state(x,u.id).investigation.completed,true);click(x,'[data-action=home]');routes++;if(routes%13===0)console.log('Research DOM routes:',routes);
 }
 const exported=JSON.parse(x.w.localStorage.getItem(KEY));const validated=Store.validate(exported,C.units.map(u=>u.id));assert.equal(Object.keys(validated.units).length,39);assert.equal(validated.units.sections.investigation.observation,exported.units.sections.investigation.observation);
 const reloaded=boot(exported,'#sections');assert.equal(state(reloaded,'sections').stage,6);assert.equal(reloaded.d.querySelector('[data-investigation-observation]').value,exported.units.sections.investigation.observation);assert.deepEqual(state(reloaded,'sections').investigation.values,exported.units.sections.investigation.values);reloaded.close();
 const imported=boot();const handle=imported.w.StereoStore.open(C.units.map(u=>u.id));handle.import(validated);click(imported,'[data-unit=sections]');assert.equal(imported.d.querySelector('[data-investigation-observation]').value,exported.units.sections.investigation.observation);assert.equal(state(imported,'sections').independent,1);imported.close();x.close();
 // Every numeric legacy stage keeps its semantic UI and its actual work.
 const legacyModel={kind:'box',a:4,b:3,h:4,level:.5,points:[{id:'M',kind:'edge',edge:1,t:.3}],lines:[],planeMode:'slider',planeIds:[]};
 for(let stage=0;stage<=5;stage++){
  const saved={version:1,units:{box:{stage,seed:9,draft:'старый черновик',taskStep:1,model:legacyModel,observation:'Старое наблюдение',written:'Старое доказательство',independent:4,attempts:8,proofDone:['s0']}}};
  const z=boot(saved,'#box'),r=state(z,'box');assert.equal(r.stage,stage);assert.equal(r.practiceVersion,1);assert.equal(r.independent,4);assert.equal(r.attempts,8);assert.equal(r.written,'Старое доказательство');assert.equal(r.observation,'Старое наблюдение');assert.deepEqual(r.proofDone,['s0']);assert.deepEqual(r.model.points,legacyModel.points);
  if(stage===0)assert.ok(z.d.querySelector('.topic-explanation'));if(stage===1)assert.ok(z.d.querySelector('#viewer canvas'));if(stage===2)assert.ok(z.d.querySelector('#proof-model svg'));if(stage===3){assert.equal(z.d.querySelector('#step-answer').value,'старый черновик');assert.equal(z.d.querySelector('#task-guide').open,true);}if(stage===4)assert.equal(z.d.querySelector('#answer').value,'старый черновик');if(stage===5)assert.equal(z.d.querySelector('#written').value,'Старое доказательство');
  click(z,'[data-stage="4"]');assert.equal(z.d.querySelector('.task-question').textContent,T.make('box-diagonal',9).q);assert.equal(state(z,'box').seed,9);click(z,'[data-action=new]');assert.equal(state(z,'box').practiceVersion,2);assert.equal(state(z,'box').seed,10);z.close();
 }
 // Stage 0 in the already-published task-first UI meant the current task;
 // distinguish it from earlier theory-stage records without discarding either.
 const compat=boot({version:1,units:{box:{stage:0,seed:7,taskFirst:{version:1,mainDraft:'точный ответ',camera:{yaw:.8,pitch:.2}}}}},'#box');assert.ok(compat.d.querySelector('#task-model svg'));assert.equal(compat.d.querySelector('#answer').value,'точный ответ');assert.equal(state(compat,'box').stage,0);click(compat,'[data-stage="0"]');assert.ok(compat.d.querySelector('.topic-explanation'));compat.close();
 // Domain/incomplete input must not consume the first mathematical attempt;
 // two wrong valid answers offer help and cannot recover independent credit.
 const n=boot(undefined,'#box');click(n,'[data-stage="4"]');const old=state(n,'box');input(n,'#answer','sqrt(');submit(n,'#answer-form');assert.equal(state(n,'box').attempts,old.attempts);input(n,'#answer','0');submit(n,'#answer-form');input(n,'#answer','1');submit(n,'#answer-form');assert.match(n.d.querySelector('#feedback').textContent,/Две содержательные попытки/);assert.equal(state(n,'box').taskFirst.errors,2);input(n,'#answer',A.format(T.make('box-diagonal',old.seed,2).a));submit(n,'#answer-form');assert.equal(state(n,'box').independent,0);n.close();
 // Same-topic research CAS: retain the stale observation for copying, keep the
 // newer geometry and progress byte-for-byte until explicit recovery.
 const stale=boot(exported,'#sections');input(stale,'[data-investigation-observation]','мой локальный опыт');const recent=JSON.parse(stale.w.localStorage.getItem(KEY));recent.units.sections.updated+=100;recent.units.sections.investigation.values.t=1.5;recent.units.sections.investigation.observation='свежий опыт другого окна';const bytes=JSON.stringify(recent);stale.w.localStorage.setItem(KEY,bytes);stale.w.dispatchEvent(new stale.w.StorageEvent('storage',{key:KEY,newValue:bytes}));assert.ok(stale.d.querySelector('[data-recover-latest]'));assert.ok(stale.d.querySelector('[data-recovery-drafts]').textContent.includes('мой локальный опыт'));submit(stale,'[data-investigation-check]');assert.equal(stale.w.localStorage.getItem(KEY),bytes);click(stale,'[data-recover-latest]');assert.equal(stale.d.querySelector('[data-investigation-observation]').value,'свежий опыт другого окна');assert.equal(state(stale,'sections').investigation.values.t,1.5);stale.close();
 // Repeated conceptual conditions are remembered across the version-2 bank.
 const repeat=boot(undefined,'#space');click(repeat,'[data-stage="4"]');const first=state(repeat,'space');input(repeat,'#answer',A.format(T.make('incidence',first.seed,2).a));submit(repeat,'#answer-form');for(let k=0;k<4;k++)click(repeat,'[data-action=new]');assert.equal(state(repeat,'space').repeatedTask,true);input(repeat,'#answer',A.format(T.make('incidence',state(repeat,'space').seed,2).a));submit(repeat,'#answer-form');assert.equal(state(repeat,'space').independent,1);repeat.close();
 for(const [id,kind]of [['space','incidence'],['parallel','parallel'],['pyramid-frustum','frustum']]){const old=T.make(kind,3,1),key=JSON.stringify([old.q,old.a]);const z=boot({version:1,units:{[id]:{stage:4,seed:3,independent:2,seenTasks:[key],currentTaskKey:key,checked:true,taskFirst:{version:1}}}},'#'+id);click(z,'[data-action=new]');assert.equal(state(z,id).repeatedTask,true,id+' renamed old condition remains a repeat');input(z,'#answer',A.format(T.make(kind,4,2,id).a));submit(z,'#answer-form');assert.equal(state(z,id).independent,2);z.close();}
 await tick();assert.deepEqual(errors,[]);console.log(`STEREO_HARMONIZATION_DOM_OK: ${routes} real research/learning/task routes, legacy stages 0–5, published stage-0 task, 39-topic export/import, invalid-input credit, research CAS, repeated conditions`);
})().catch(error=>{console.error(error);process.exitCode=1;});
