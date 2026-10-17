'use strict';
// DOM/state-contract regression with synthetic data; no network or pupil writes.
const {JSDOM}=require('jsdom'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8'),plain=x=>JSON.parse(JSON.stringify(x));
const D=require('../ege-baza/path/data');
for(const f of ['practice','equation-practice','grade7-algebra','grade7-geometry','grade7-foundations','pre7-arithmetic','pre7-applications','grade7-geometry-core','grade7-geometry-practice','grade7-geometry-rebuild-base','grade7-geometry-rebuild-foundations','grade7-geometry-rebuild-triangles','grade7-geometry-rebuild-relations','grade7-geometry-rebuild-workbook'])require('../ege-baza/path/'+f);
function fixture(managed=true,id='grade7-r-photo-proof-1'){
 const dom=new JSDOM('<!doctype html><header></header><div id="storage" hidden></div><main id="main"></main><footer></footer>',{url:'https://fixture.test/ege-baza/path/index.html'+(managed?'?learning=1':'#lesson='+id),runScripts:'outside-only'}),w=dom.window,events=[];
 w.PathData=D;
 for(const file of ['practice-view','grade7-geometry-core-models','managed-state'])w.eval(read('ege-baza/path/'+file+'.js'));
 let bridge;w.MathExamLearning={register(value){bridge=value;}};
 if(managed)w.eval(read('ege-baza/path/managed.js'));
 else w.eval(read('ege-baza/path/app.js'));
 const click=selector=>{const node=w.document.querySelector(selector);assert(node,selector);node.click();};
 if(bridge)bridge.subscribe(event=>events.push(plain(event)));
 return {dom,w,events,bridge,host:w.document.querySelector('main'),click,realm:x=>w.JSON.parse(JSON.stringify(x))};
}
let checked=0;
for(const problem of [1,2,3])for(const seed of [0,1,23,71]){
 const f=fixture(),{w,bridge,host,click,events,realm}=f,task=D.task('grade7-r-photo-proof-'+problem,seed),original=JSON.stringify(task);
 const spec={trainerId:'ege-path',id:task.id,contentVersion:1,seed,task};
 bridge.applyState(realm({taskSpec:spec,state:null,readOnly:false}));
 assert.equal(events.length,0,'Opening a saved task is silent');assert(!host.querySelector('.stage-nav'));assert(!host.textContent.includes('мастерскую'));
 click('[data-proof-start]');assert.equal(bridge.getState().work.stage,2);assert.equal(events.at(-1).kind,'hint');
 for(let step=0;step<6;step++){
  const item=task.steps[step],right=String(item.a),wrong=item.choices.find(c=>c.value!==right).value;
  assert(!host.textContent.includes('и основание'));
  if(problem===1&&step===2)assert.match(host.querySelector('h2').textContent,/Наше доказательство/);
  click('[data-answer-choice="'+wrong+'"]');click('#answerForm button.primary');
  assert.equal(bridge.getState().work.step,step);assert(host.querySelector('#feedback').textContent.length>10);
  click('#hint');assert(bridge.getState().work.help);assert(host.querySelector('#hintText').textContent);
  click('[data-answer-choice="'+right+'"]');
  const before=plain(bridge.getState());
  bridge.applyState(realm({taskSpec:spec,state:before,readOnly:false}));
  assert.deepEqual(plain(bridge.getState()),before,'Echo/restoration keeps the exact semantic state');
  assert.equal(host.querySelector('[data-answer-choice="'+right+'"]').getAttribute('aria-pressed'),'true');
  if(problem===1&&step===2){
   assert.match(host.querySelector('#photo-question').textContent,/Назови общую сторону/);
   assert.equal(host.querySelector('[data-answer-choice="'+right+'"]').textContent,'AC');
   assert(host.querySelector('[data-core-part="AC"].photo-proof-focus'));
  }
  click('#answerForm button.primary');
  assert.equal(bridge.getState().work.step,step+1);
  assert.deepEqual(plain(bridge.getState().work.answers),task.steps.slice(0,step+1).map(s=>String(s.a)));
  assert.deepEqual(events.at(-1).details,{scope:'step',step,answer:right,answers:task.steps.slice(0,step).map(s=>String(s.a))});
  checked++;
 }
 assert(bridge.getState().work.done);assert.match(host.textContent,problem===2?/третий признак/:/первый признак/);
 assert.equal(host.querySelectorAll('.photo-proof-record li').length,5,'Final proof is a short complete argument');
 click('[data-proof-write]');const note=host.querySelector('#note');note.value='Моё доказательство сохранено.';note.dispatchEvent(new w.Event('input'));
 const saved=plain(bridge.getState()),count=events.length;
 bridge.applyState(realm({taskSpec:spec,state:saved,readOnly:true}));
 assert.equal(host.querySelector('#note').value,saved.work.note);click('[data-proof-start]');
 assert.equal(events.length,count,'Readonly viewing cannot emit commands');assert.deepEqual(plain(bridge.getState()),saved);
 assert.equal(JSON.stringify(task),original,'Saved task stays immutable');f.dom.window.close();
}
{
 const f=fixture(),{w,bridge,host,realm,click,events}=f,task=D.task('grade7-r-photo-proof-1',23),spec={trainerId:'ege-path',id:task.id,contentVersion:1,seed:23,task};
 const state=plain(w.PathManagedState.fresh(realm(spec)));state.work.stage=2;state.work.step=2;state.work.answers=task.steps.slice(0,2).map(s=>String(s.a));state.work.help=true;state.work.note='Старая запись';
 state.work.model={kind:'grade7-construction',selected:'BC',built:[],revealed:1};state.view.supportOpen=[0];
 bridge.applyState(realm({taskSpec:spec,state,readOnly:false}));assert.deepEqual(plain(bridge.getState()),state);assert.equal(events.length,0);
 host.querySelector('[data-core-part="AC"] path').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
 assert.equal(bridge.getState().work.draft,String(task.steps[2].a),'Clicking the common side selects the same saved answer value');
 const readonly=plain(bridge.getState());bridge.applyState(realm({taskSpec:spec,state:readonly,readOnly:true}));const before=events.length;
 click('[data-answer-choice]');click('#answerForm button.primary');click('#hint');assert.equal(events.length,before);assert.deepEqual(plain(bridge.getState()),readonly);
 f.dom.window.close();
}
{
 const f=fixture(),task=D.task(D.geometryRebuild.families.find(m=>!m.id.includes('photo-proof')).id,1),spec={trainerId:'ege-path',id:task.id,contentVersion:1,seed:1,task};
 f.bridge.applyState(f.realm({taskSpec:spec,state:null,readOnly:false}));assert(f.host.querySelector('.stage-nav'),'Unrelated trainers retain their existing flow');f.dom.window.close();
}
for(const problem of [1,2,3]){
 const id='grade7-r-photo-proof-'+problem,f=fixture(false,id),{w,host,click}=f;
 click('[data-proof-start]');const lesson=w.PathCourse.state().lessons[id],task=D.task(id,lesson.seed);
 for(const item of task.steps){click('[data-answer-choice="'+item.a+'"]');click('#answerForm button.primary');}
 assert.equal(lesson.guided,1);assert.equal(lesson.independent,0);assert.equal(lesson.step,6);
 click('[data-proof-write]');const note=host.querySelector('#note');assert(note);note.value='а'.repeat(5000);note.dispatchEvent(new w.Event('input'));assert.equal(lesson.note.length,5000,'Public notes keep their existing 10000-character limit');
 assert(w.PathCourse.valid(w.PathCourse.state()),'The public saved-state contract remains valid');f.dom.window.close();
}
console.log('CLEAR_PHOTO_PROOF_DOM_OK: '+checked+' guided steps; 3 problems; rotated choices; old saved tasks/drafts/models/notes; diagram selection; readonly isolation; public and managed flows.');
