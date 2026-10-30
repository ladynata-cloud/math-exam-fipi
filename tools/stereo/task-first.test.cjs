'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'../..'),C=require(root+'/stereo-course/data/course.json'),T=require(root+'/stereo-course/assets/tasks.js'),A=require(root+'/stereo-course/assets/answer.js');
const links={polyhedra:'section',coordinates:'box-diagonal','sphere-equation':'sphere-cut','plane-equation':'dot',transformations:'scale',slices:'pyramid-volume','pyramid-frustum':'frustum',sphere:'sphere-cut',box:'box-diagonal'};
for(const u of C.units)if(links[u.id])u.proof=links[u.id];
function boot(saved,hash=''){
 const dom=new JSDOM('<header><button id="home"></button><nav class="toplinks"></nav><button id="export-progress"></button></header><p id="storage-notice" hidden></p><main id="app"></main>',{url:'https://example.test/stereo-course/index.html'+hash,runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.STEREO_COURSE=C;w.STEREO_PROOFS=require(root+'/stereo-course/data/proofs.json');if(saved)w.localStorage.setItem('mathExamStereo.v1',JSON.stringify(saved));
 w.mounts=[];w.StereoTaskScenes={mount(el,options){assert.equal(options.task.q,T.make(options.kind,JSON.parse(w.localStorage.getItem('mathExamStereo.v1')).units[w.location.hash.slice(1)].seed).q);el.innerHTML='<svg data-task-scene="true"></svg>';let camera=options.savedCamera||{yaw:0.6,pitch:0.4};const mount={el,options,lastStep:options.step,destroyed:false,setStep(i){this.lastStep=i;},getState(){return camera;},destroy(){this.destroyed=true;},move(yaw,pitch){camera={yaw,pitch};options.onChange(camera);}};w.mounts.push(mount);return mount;}};
 w.StereoTaskScenes.mountProof=(el,options)=>{el.innerHTML='<svg data-proof-scene="true"></svg>';let camera=options.savedCamera||{yaw:.5,pitch:.4};return{setStep(){},getState:()=>camera,destroy(){},move(yaw,pitch){camera={yaw,pitch};options.onChange(camera);}};};
 w.SpaceViewer={mount(el,options,callback){el.innerHTML='<canvas></canvas>';return{destroy(){},options,callback};}};
 for(const file of ['answer.js','tasks.js','store.js','math-text.js','app.js'])w.eval(fs.readFileSync(root+'/stereo-course/assets/'+file,'utf8'));
 return {w,dom,doc:w.document,close:()=>dom.window.close()};
}
function plainDisplay(el){const c=el.cloneNode(true);for(const f of c.querySelectorAll('.stereo-fraction'))f.replaceWith(f.children[0].textContent+'/'+f.children[1].textContent);return c.textContent;}
function click(e,selector){const x=e.doc.querySelector(selector);assert.ok(x,selector);x.click();return x;}
function input(e,selector,text){const x=e.doc.querySelector(selector);assert.ok(x,selector);x.value=text;x.dispatchEvent(new e.w.Event('input',{bubbles:true}));}
function submit(e,selector){e.doc.querySelector(selector).dispatchEvent(new e.w.Event('submit',{bubbles:true,cancelable:true}));}
function state(e,id){return JSON.parse(e.w.localStorage.getItem('mathExamStereo.v1')).units[id];}
const tick=()=>new Promise(r=>setTimeout(r,8));
function checkHomeHero(doc){
 const svg=doc.querySelector('.hero-art svg');assert(svg,'course cover has its spatial figure');
 const points={A:[65,240],B:[235,290],C:[345,210],D:[180,165],A1:[65,85],B1:[235,135],C1:[345,70],D1:[180,20],M:[65,160],N:[235,220],P:[345,130],Q:[180,95]};
 const name=xy=>{const match=Object.entries(points).find(([,p])=>p[0]===xy[0]&&p[1]===xy[1]);assert(match,'retained cover vertex '+xy);return match[0];};
 const key=(a,b)=>[a,b].sort().join('-'),expected={
  'body-hidden':[['A','D'],['C','D'],['D','D1']],
  'body-visible':[['A','B'],['B','C'],['A','A1'],['A1','D1'],['D1','C1'],['C1','C'],['A1','B1'],['B1','C1'],['B1','B']],
  'section-hidden':[['M','Q'],['Q','P']], 'section-visible':[['M','N'],['N','P']]
 };
 assert.equal(svg.querySelectorAll('[data-hero-lines]').length,4);
 for(const [group,pairs]of Object.entries(expected)){
  const path=svg.querySelector('[data-hero-lines="'+group+'"]');assert(path);
  assert.equal(path.hasAttribute('stroke-dasharray'),group.endsWith('hidden'),'rear cover edges must be dashed');
  if(group.endsWith('hidden'))assert.match(path.getAttribute('stroke-dasharray'),/^6 5$/);
  const tokens=path.getAttribute('d').match(/[ML]|-?\d+(?:\.\d+)?/g),edges=[];let last=null;
  for(let i=0;i<tokens.length;){const cmd=tokens[i++];assert(['M','L'].includes(cmd));const point=name([+tokens[i++],+tokens[i++]]);if(cmd==='L'){assert(last);edges.push(key(last,point));}last=point;}
  assert.deepEqual(edges.sort(),pairs.map(([a,b])=>key(a,b)).sort(),group+' retains exact visible/hidden topology');
 }
 for(const path of svg.querySelectorAll('path:not([data-hero-lines])'))assert.equal(path.getAttribute('stroke'),'none','section fill must not repaint hidden edges solid');
}
(async()=>{
 const e=boot();
 checkHomeHero(e.doc);
 const rear=e.doc.querySelector('[data-hero-lines="body-hidden"]');rear.removeAttribute('stroke-dasharray');assert.throws(()=>checkHomeHero(e.doc));rear.setAttribute('stroke-dasharray','6 5');
 const fill=e.doc.querySelector('[data-hero-fill]');fill.setAttribute('stroke','#f0bd76');assert.throws(()=>checkHomeHero(e.doc));fill.setAttribute('stroke','none');checkHomeHero(e.doc);
 for(const u of C.units){
  click(e,'[data-unit="'+u.id+'"]');const rec=state(e,u.id),t=T.make(u.task,rec.seed),model=e.doc.querySelector('#task-model svg'),answer=e.doc.querySelector('#answer');
  assert.equal(plainDisplay(e.doc.querySelector('.task-question')),t.q);assert.ok(model,u.id+' model immediately');assert.equal(e.doc.querySelector('#task-help').open,false);assert.equal(e.doc.querySelector('#answer-form').dataset.mode,'independent');
  const label=plainDisplay(e.doc.querySelector('label[for=answer]'));assert.ok(t.q.includes(label),u.id+' label from condition');assert.ok(label.length>5);
  input(e,'#answer','мой черновик '+u.id);const mount=e.w.mounts.at(-1);mount.move(1.2,.3);
  click(e,'[data-action=help]');await tick();assert.equal(e.doc.querySelector('#task-help').open,true);assert.equal(state(e,u.id).assisted,true);assert.strictEqual(e.doc.querySelector('#answer'),answer);assert.strictEqual(e.doc.querySelector('#task-model svg'),model);assert.equal(mount.lastStep,-1);
  click(e,'#task-guide>summary');await tick();assert.equal(mount.lastStep,0);input(e,'#step-answer','промежуточный');click(e,'#task-help>summary');await tick();assert.equal(e.doc.querySelector('#task-help').open,false);assert.equal(answer.value,'мой черновик '+u.id);assert.equal(state(e,u.id).taskFirst.stepDraft,'промежуточный');
  click(e,'[data-action=help]');await tick();assert.equal(e.doc.querySelector('#step-answer').value,'промежуточный');assert.deepEqual(state(e,u.id).taskFirst.camera,{yaw:1.2,pitch:.3});
  for(const s of t.steps){input(e,'#step-answer',A.format(s.a));submit(e,'#step-answer-form');assert.strictEqual(e.doc.querySelector('#answer'),answer);assert.strictEqual(e.doc.querySelector('#task-model svg'),model);assert.equal(answer.value,'мой черновик '+u.id);}
  assert.equal(state(e,u.id).guided,true);assert.match(e.doc.querySelector('#task-guide-body').textContent,/Разбор завершён/);
  input(e,'#answer',A.format(t.a));submit(e,'#answer-form');assert.equal(state(e,u.id).independent,0);assert.equal(state(e,u.id).attempts,1);assert.match(e.doc.querySelector('#feedback').textContent,/с подсказкой/);
  click(e,'[data-action=new]');const next=state(e,u.id),t2=T.make(u.task,next.seed);assert.equal(e.doc.querySelector('#answer').value,'');assert.equal(next.taskFirst.stepDraft,'');assert.equal(next.assisted,false);assert.deepEqual(e.w.mounts.at(-1).getState(),{yaw:.6,pitch:.4});
  input(e,'#answer',A.format(t2.a));submit(e,'#answer-form');const repeated=JSON.stringify([t.q,t.a])===JSON.stringify([t2.q,t2.a]);assert.equal(state(e,u.id).independent,repeated?0:1,u.id+' first credit');submit(e,'#answer-form');assert.equal(state(e,u.id).independent,repeated?0:1,u.id+' no duplicate credit');
  click(e,'[data-action=home]');
 }
 e.close();
 // Old stages keep their exact drafts in the appropriate field, without inventing context.
 for(const oldStage of [0,1,2,3,4,5]){
  const legacy={version:1,units:{box:{stage:oldStage,seed:9,draft:'старый ответ',taskStep:1,independent:4,attempts:8,proofDone:['s0'],written:'доказательство'}}};
  const x=boot(legacy,'#box'),s=state(x,'box');assert.ok(x.doc.querySelector('#task-model svg'));assert.equal(s.stage,4);assert.equal(s.taskStep,1);assert.equal(s.independent,4);assert.equal(s.written,'доказательство');assert.deepEqual(s.proofDone,['s0']);
  assert.equal(s.taskFirst.mainDraft,oldStage===4?'старый ответ':'');assert.equal(s.taskFirst.stepDraft,oldStage===3?'старый ответ':'');assert.equal(s.taskFirst.legacyDraft,[3,4].includes(oldStage)?'':'старый ответ');
  if(oldStage===3)assert.equal(s.assisted,true);x.close();
 }
 // Reload retains separate drafts, accepted steps and camera; returning from proof preserves the exact task.
 const x=boot(undefined,'#sphere');input(x,'#answer','финальный черновик');click(x,'[data-action=help]');click(x,'#task-guide>summary');await tick();input(x,'#step-answer','шаг черновик');x.w.mounts.at(-1).move(.8,.25);click(x,'#task-theory>summary');await tick();
 const saved=JSON.parse(x.w.localStorage.getItem('mathExamStereo.v1'));x.close();const y=boot(saved,'#sphere');assert.equal(y.doc.querySelector('#answer').value,'финальный черновик');assert.equal(y.doc.querySelector('#step-answer').value,'шаг черновик');assert.deepEqual(JSON.parse(JSON.stringify(y.w.mounts.at(-1).getState())),{yaw:.8,pitch:.25});const seed=state(y,'sphere').seed;
 click(y,'[data-stage="2"]');assert.equal(y.doc.querySelector('#task-model'),null,'numeric scene absent from separate proof');assert.ok(y.doc.querySelector('#proof-model svg'),'separate proof scene');click(y,'[data-stage="4"]');assert.equal(state(y,'sphere').seed,seed);assert.equal(y.doc.querySelector('#answer').value,'финальный черновик');assert.deepEqual(JSON.parse(JSON.stringify(y.w.mounts.at(-1).getState())),{yaw:.8,pitch:.25});y.close();
 // Writing a separate proof reveals related theory, so it cannot preserve independent credit.
 for(const id of ['basis','box']){const w=boot(undefined,'#'+id);click(w,'[data-stage="5"]');assert.match(w.doc.querySelector('.panel .eyebrow').textContent,/Отдельная задача/);assert.ok(w.doc.querySelector('#proof-model svg'));click(w,'[data-stage="4"]');input(w,'#answer',A.format(T.make(C.units.find(u=>u.id===id).task,1).a));submit(w,'#answer-form');assert.equal(state(w,id).independent,0);assert.equal(state(w,id).assisted,true);w.close();}
 // Immediate check after programmatic native help opening must never race an independent credit.
 const z=boot(undefined,'#box');z.doc.querySelector('#task-help').open=true;input(z,'#answer',A.format(T.make('box-diagonal',1).a));submit(z,'#answer-form');assert.equal(state(z,'box').independent,0);assert.equal(state(z,'box').assisted,true);z.close();
 // Restored supplementary views also count as help even when imported flags are inconsistent.
 const restored=boot({version:1,units:{basis:{seed:1,stage:5,assisted:false,taskFirst:{version:1}}}},'#basis');click(restored,'[data-stage="4"]');input(restored,'#answer','нет');submit(restored,'#answer-form');assert.equal(state(restored,'basis').independent,0);assert.equal(state(restored,'basis').assisted,true);restored.close();
 // A stale tab cannot overwrite a newer condition or same-condition help, and its drafts remain recoverable.
 for(const otherSeed of [false,true]){
  const stale=boot(undefined,'#box');input(stale,'#answer','мой прежний черновик');
  const old=state(stale,'box'),latest=JSON.parse(stale.w.localStorage.getItem('mathExamStereo.v1')),updated={...latest.units.box,updated:old.updated+10,seed:otherSeed?old.seed+1:old.seed,assisted:true,checked:false};
  updated.taskFirst={...updated.taskFirst,mainDraft:'новый сохранённый черновик',stepDraft:'новый шаг',helpOpen:true};latest.units.box=updated;
  stale.w.localStorage.setItem('mathExamStereo.v1',JSON.stringify(latest));const bytes=stale.w.localStorage.getItem('mathExamStereo.v1');
  submit(stale,'#answer-form');assert.equal(stale.w.localStorage.getItem('mathExamStereo.v1'),bytes,'stale submit must not write');assert.equal(stale.doc.querySelector('#answer-form button').disabled,true);assert.equal(stale.doc.querySelector('#answer').readOnly,true);
  assert.ok(stale.doc.querySelector('[data-recovery-drafts]').textContent.includes(T.make('box-diagonal',old.seed).q));assert.equal(stale.doc.querySelector('[data-recovery-drafts] textarea').value,'мой прежний черновик');
  click(stale,'[data-recover-latest]');assert.equal(stale.doc.querySelector('#answer').value,'новый сохранённый черновик');assert.equal(stale.doc.querySelector('[data-recovery-drafts] textarea').value,'мой прежний черновик');assert.equal(state(stale,'box').seed,updated.seed);assert.equal(state(stale,'box').assisted,true);
  input(stale,'#answer',A.format(T.make('box-diagonal',updated.seed).a));submit(stale,'#answer-form');assert.equal(state(stale,'box').independent,0);stale.close();
 }
 console.log('STEREO_TASK_FIRST_DOM_OK: 39 units, separated drafts, actual-model retention, legacy stages, honest first credit, proof return');
})().catch(error=>{console.error(error);process.exitCode=1;});
