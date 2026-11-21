'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom'),{resolvePublicScript}=require('./public-page-script.cjs');
const State=require('../ege-profil/start/state.js');
const lessons=['geometry','algebra','stereo','probability','equations','functions','applied','finance','readiness'].flatMap(name=>require('../ege-profil/start/'+name+'-data.js'));
const lesson=lessons.find(l=>l.id==='vec-coordinates'),key=lesson.id+':independent';
const root=path.resolve(__dirname,'..');
function memory(seed){const values=new Map([['unrelated-course','keep']]);if(seed)values.set(State.KEY,JSON.stringify(seed));return {getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};}
function snapshot(storage){return JSON.parse(storage.getItem(State.KEY));}
function finish(state,l,mode,s){const t=l.tasks.find(t=>t.id===s.taskId);s.answers=mode==='guided'?t.steps.map(q=>String(q.answer)): [String(t.answer)];state.finish(l.id,mode,s);return s;}
function supported(state,l=lesson,mode='guided'){return finish(state,l,mode,state.start(l.id,mode));}

test('guided and plan handoffs across all 81 topics reserve a different unseen independent condition without crediting the transition',()=>{
 assert.equal(lessons.length,81);
 for(const l of lessons)for(const mode of ['guided','plan']){
  const storage=memory(),state=State.create(lessons,storage),source=supported(state,l,mode),before=snapshot(storage);
  const preview=state.independentHandoff(l.id,source);
  assert.equal(preview.kind,'new',l.id);assert.notEqual(preview.taskId,source.taskId);
  assert.deepEqual(snapshot(storage).seen,before.seen,'preview must not expose conditions');
  assert.equal(state.data.sessions[l.id+':independent'],undefined);
  const next=state.independentHandoff(l.id,source,true);
  assert.equal(next.session.taskId,preview.taskId);assert.ok(l.tasks.slice(-3).some(t=>t.id===next.taskId));
  assert.equal(next.session.assisted,false);assert.equal(next.session.familiar,false);assert.equal(next.session.done,false);
  assert.deepEqual(snapshot(storage).records,before.records,'navigation cannot add attempts or mastery');
  assert.equal(storage.getItem('unrelated-course'),'keep');
 }
});

test('a different unfinished independent attempt, even an untouched one, is resumed with every draft and flag intact',()=>{
 for(const withWork of [false,true]){
  const storage=memory(),state=State.create(lessons,storage),active=state.start(lesson.id,'independent');
  if(withWork)Object.assign(active,{draft:'17/9',answers:['1'],wrong:true,assisted:true});
  state.persist();const source=supported(state),before=snapshot(storage);
  assert.equal(state.independentHandoff(lesson.id,source).kind,'resume');
  const result=state.independentHandoff(lesson.id,source,true);
  assert.equal(result.session,active);assert.deepEqual(snapshot(storage),before);
 }
});

test('after remediation the earlier same assisted source is replaced by another unseen condition, without promoting the explained task',()=>{
 const storage=memory(),state=State.create(lessons,storage),source=state.start(lesson.id,'independent');
 source.draft='17/9';state.persist();const explained=finish(state,lesson,'guided',state.remediate(lesson.id,source.taskId));
 assert.equal(source.assisted,true);const before=snapshot(storage);
 assert.equal(state.independentHandoff(lesson.id,explained).kind,'new');
 assert.deepEqual(snapshot(storage).sessions[key],before.sessions[key],'preview leaves the original assisted work available');
 const next=state.independentHandoff(lesson.id,explained,true);
 assert.notEqual(next.taskId,source.taskId);assert.equal(next.session.familiar,false);assert.equal(next.session.assisted,false);
 finish(state,lesson,'independent',next.session);
 assert.deepEqual(state.record(lesson.id).independent,[next.taskId]);
 assert.deepEqual(state.record(lesson.id).guided,[source.taskId]);
});

test('all three independent conditions are used before familiar practice, which excludes the just-finished condition and adds no new credit',()=>{
 const storage=memory(),state=State.create(lessons,storage);let source=supported(state);const used=[];
 for(let i=0;i<3;i++){
  const next=state.independentHandoff(lesson.id,source,true);assert.equal(next.kind,'new');
  used.push(next.taskId);source=finish(state,lesson,'independent',next.session);
 }
 assert.equal(new Set(used).size,3);assert.deepEqual(new Set(used),new Set(lesson.tasks.slice(-3).map(t=>t.id)));
 const before=[...state.record(lesson.id).independent],next=state.independentHandoff(lesson.id,source,true);
 assert.equal(next.kind,'familiar');assert.equal(next.session.familiar,true);assert.notEqual(next.taskId,source.taskId);
 finish(state,lesson,'independent',next.session);
 assert.deepEqual(state.record(lesson.id).independent,before);assert.deepEqual(state.record(lesson.id).recovered,[next.taskId]);
});

test('a stale handoff refreshes a new second-tab attempt, including a newer attempt of the same task ID',()=>{
 for(const repeatSource of [false,true]){
  const storage=memory(),first=State.create(lessons,storage);
  const source=repeatSource?finish(first,lesson,'independent',first.start(lesson.id,'independent')):supported(first);
  assert.equal(first.independentHandoff(lesson.id,source).kind,'new');
  const second=State.create(lessons,storage);let latest;
  for(let i=0;i<(repeatSource?3:1);i++)latest=second.start(lesson.id,'independent',true);
  if(repeatSource)assert.equal(latest.taskId,source.taskId);
  latest.draft='second tab: 13/7';second.persist();const before=snapshot(storage);
  const resumed=first.independentHandoff(lesson.id,source,true);
  assert.equal(resumed.kind,'resume');assert.equal(resumed.session.started,latest.started);
  assert.equal(resumed.session.draft,'second tab: 13/7');assert.deepEqual(snapshot(storage),before);
 }
});

test('same-attempt draft updates from another tab are refreshed before resuming',()=>{
 const storage=memory(),first=State.create(lessons,storage),source=supported(first);
 first.start(lesson.id,'independent');assert.equal(first.independentHandoff(lesson.id,source).kind,'resume');
 const second=State.create(lessons,storage),other=second.start(lesson.id,'independent');other.draft='newer working';second.persist();
 assert.equal(first.independentHandoff(lesson.id,source,true).session.draft,'newer working');
 assert.equal(snapshot(storage).sessions[key].draft,'newer working');
});

test('legacy result histories with missing seen counters stay familiar and opaque saved fields survive',()=>{
 for(const kind of ['guided','independent','recovered','checkpointIndependent','mistakes']){
  const ids=lesson.tasks.slice(-3).map(t=>t.id),records={[lesson.id]:{guided:[],independent:[],attempts:3,[kind]:ids,legacy:'keep'}};
  const storage=memory({version:1,records,seen:{},sessions:{},opaque:{keep:true}}),state=State.create(lessons,storage);
  const source={taskId:lesson.tasks[0].id,started:'2026-10-01T08:00:00.000Z'};
  assert.equal(state.independentHandoff(lesson.id,source).kind,'familiar',kind);
  const before=[...state.record(lesson.id).independent],next=state.independentHandoff(lesson.id,source,true);
  assert.equal(next.session.familiar,true,kind);finish(state,lesson,'independent',next.session);
  assert.deepEqual(state.record(lesson.id).independent,before,kind);
  assert.equal(snapshot(storage).records[lesson.id].legacy,'keep');assert.deepEqual(snapshot(storage).opaque,{keep:true});
 }
});

test('legacy same-task assistance without attempt timestamps resumes honestly instead of discarding ambiguous work',()=>{
 const taskId=lesson.tasks.at(-1).id,session={taskId,step:0,assisted:true,done:false,draft:'legacy draft',answers:[]};
 const storage=memory({version:1,records:{},seen:{},sessions:{[key]:session}}),state=State.create(lessons,storage);
 const before=snapshot(storage),next=state.independentHandoff(lesson.id,{taskId,started:''},true);
 assert.equal(next.kind,'resume');assert.equal(next.assisted,true);assert.equal(next.session.draft,'legacy draft');
 assert.deepEqual(snapshot(storage).seen,before.seen);assert.equal(state.record(lesson.id).attempts,0);
});

const controllers=new WeakMap();
function boot(id=lesson.id,mode='guided',seed,board=false){
 const file=path.join(root,board?'trainers/ege-profile-expressions.html':'ege-profil/start/index.html');
 const dom=new JSDOM(fs.readFileSync(file,'utf8'),{url:'https://mathexam.space/'+path.relative(root,file)+'#practice/'+id+'/'+mode,runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
 if(seed)w.localStorage.setItem(State.KEY,JSON.stringify(seed));w.localStorage.setItem('unrelated-course','keep');
 for(const script of w.document.querySelectorAll('script[src]')){
  const filename=resolvePublicScript(root,path.dirname(file),script.getAttribute('src'));
  if(filename===path.join(root,'ege-profil/start/app.js')){
   const create=w.ProfileState.create;w.ProfileState.create=(...args)=>{const controller=create(...args);if(!controllers.has(w))controllers.set(w,controller);if(board)controller.independentHandoff=()=>{throw Error('public handoff entered board');};return controller;};
   if(board)w.MathExamBoard={register(){}};
  }
  w.eval(fs.readFileSync(filename,'utf8'));
 }
 return dom;
}
function data(w){return JSON.parse(JSON.stringify(controllers.get(w).data));}
function complete(w,id,mode){
 const l=w.ProfileLessons.find(l=>l.id===id);
 for(let limit=0;!w.document.querySelector('.result-panel')&&limit<20;limit++){
  const s=data(w).sessions[id+':'+mode],t=l.tasks.find(t=>t.id===s.taskId),q=mode==='guided'?t.steps[s.step]:t;
  const form=w.document.getElementById('answer-form'),input=form.querySelector('input[type="text"]');
  if(input){input.value=String(q.answerExact??q.answer);input.dispatchEvent(new w.Event('input',{bubbles:true}));}
  else{const radio=[...form.querySelectorAll('input[type="radio"]')].find(x=>x.value===String(q.answer));assert(radio);radio.checked=true;radio.dispatchEvent(new w.Event('change',{bubbles:true}));}
  form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
  const next=w.document.getElementById('next');assert.equal(next.disabled,false,'correct answer should be accepted');next.click();
 }
 assert(w.document.querySelector('.result-panel'),'task actually finished');
 return data(w).sessions[id+':'+mode];
}
async function click(w,selector){w.document.querySelector(selector).click();await new Promise(resolve=>w.setTimeout(resolve,0));}

for(const mode of ['guided','plan'])test('public '+mode+' result visibly offers a direct different independent condition and keeps legacy choices',async()=>{
 const dom=boot(lesson.id,mode),w=dom.window,d=w.document;
 try{
  const source=complete(w,lesson.id,mode),before=data(w),primary=d.getElementById('independent-check');
  assert.equal(primary.textContent,'Проверить себя на другом условии');assert.equal(primary.classList.contains('quiet'),false);
  assert(primary.compareDocumentPosition(d.querySelector('.solution'))&w.Node.DOCUMENT_POSITION_FOLLOWING,'primary precedes the worked solution');
  assert.equal(d.getElementById('another').textContent,mode==='guided'?'Ещё задача по шагам':'Следующая задача');
  assert.equal(d.getElementById('another').classList.contains('quiet'),true);assert(d.getElementById('switch'));
  assert.equal(before.sessions[key],undefined,'result preview does not consume independent pool');
  await click(w,'#independent-check');const next=data(w).sessions[key];
  assert.equal(w.location.hash,'#practice/'+lesson.id+'/independent');assert.notEqual(next.taskId,source.taskId);
  assert.equal(next.assisted,false);assert.equal(next.familiar,false);assert.equal(d.querySelector('.task-kind').textContent,'Новое условие');
  assert.deepEqual(data(w).records[lesson.id],before.records[lesson.id]);assert.equal(w.localStorage.getItem('unrelated-course'),'keep');
 }finally{w.close();}
});

test('public remediation result checks another condition instead of reopening its assisted independent source',async()=>{
 const dom=boot(lesson.id,'independent'),w=dom.window;
 try{
  const source=data(w).sessions[key];await click(w,'#repair-current');
  assert.equal(data(w).sessions[lesson.id+':guided'].taskId,source.taskId);
  complete(w,lesson.id,'guided');assert.equal(w.document.getElementById('independent-check').textContent,'Проверить себя на другом условии');
  await click(w,'#independent-check');const next=data(w).sessions[key];
  assert.notEqual(next.taskId,source.taskId);assert.equal(next.assisted,false);assert.equal(next.familiar,false);
  assert.deepEqual(data(w).records[lesson.id].independent,[]);assert.deepEqual(data(w).records[lesson.id].guided,[source.taskId]);
 }finally{w.close();}
});

test('a result CTA rendered before another tab starts work resumes that live draft rather than creating its cached recommendation',async()=>{
 const dom=boot(),w=dom.window;
 try{
  complete(w,lesson.id,'guided');assert.equal(w.document.getElementById('independent-check').textContent,'Проверить себя на другом условии');
  const second=w.ProfileState.create(w.ProfileLessons,w.localStorage),session=second.start(lesson.id,'independent',true);
  session.draft='13/7';second.persist();const before=JSON.parse(w.localStorage.getItem(State.KEY));
  await click(w,'#independent-check');const after=JSON.parse(w.localStorage.getItem(State.KEY));
  assert.deepEqual(after.sessions[key],before.sessions[key]);assert.deepEqual(after.seen,before.seen);
  assert.equal(w.document.getElementById('answer').value,'13/7');
 }finally{w.close();}
});

test('result resumption and exhausted legacy histories use truthful labels and actual destinations',async()=>{
 for(const resume of [false,true]){
  const storage=memory(),state=State.create(lessons,storage);supported(state);
  const seed=snapshot(storage),ids=lesson.tasks.slice(-3).map(t=>t.id);
  seed.records[lesson.id].guided.push(...ids);seed.seen={};
  if(resume)seed.sessions[key]={taskId:ids[1],step:0,wrong:true,assisted:true,done:false,draft:'saved work',answers:[],started:'2026-11-09T12:00:00.000Z'};
  const dom=boot(lesson.id,'guided',seed),w=dom.window;
  try{
   const primary=w.document.getElementById('independent-check');
   assert.equal(primary.textContent,resume?'Продолжить начатую задачу':'Повторить другое знакомое условие');
   assert.doesNotMatch(w.document.querySelector('.result-panel .lead').textContent,/новое условие/i);
   if(resume)assert.match(w.document.getElementById('independent-check-note').textContent,/с помощью или после ошибки/);
   await click(w,'#independent-check');assert.equal(w.location.hash,'#practice/'+lesson.id+'/independent');
   if(resume){assert.equal(w.document.getElementById('answer').value,'saved work');assert.equal(data(w).sessions[key].assisted,true);}
   else{assert.equal(data(w).sessions[key].familiar,true);assert.equal(w.document.querySelector('.task-kind').textContent,'Повтор знакомой задачи');}
  }finally{w.close();}
 }
});

test('a stale independent result preserves a newer same-task attempt when the route does not change',async()=>{
 const dom=boot(lesson.id,'independent'),w=dom.window;
 try{
  const source=complete(w,lesson.id,'independent'),second=w.ProfileState.create(w.ProfileLessons,w.localStorage);let current;
  for(let i=0;i<3;i++)current=second.start(lesson.id,'independent',true);
  assert.equal(current.taskId,source.taskId);assert.notEqual(current.started,source.started);
  current.draft='new attempt on same task';second.persist();const before=JSON.parse(w.localStorage.getItem(State.KEY));
  await click(w,'#independent-check');const after=JSON.parse(w.localStorage.getItem(State.KEY));
  assert.deepEqual(after.sessions[key],before.sessions[key]);assert.deepEqual(after.seen,before.seen);
  assert.equal(w.document.getElementById('answer').value,'new attempt on same task');assert.equal(w.document.querySelector('.result-panel'),null);
 }finally{w.close();}
});

test('legacy public result actions still offer another guided task and then the short-plan route',async()=>{
 const dom=boot(),w=dom.window;
 try{
  w.document.getElementById('calm-toggle').click();
  const source=complete(w,lesson.id,'guided');await click(w,'#another');
  assert.equal(w.location.hash,'#practice/'+lesson.id+'/guided');assert.notEqual(data(w).sessions[lesson.id+':guided'].taskId,source.taskId);
  complete(w,lesson.id,'guided');assert.equal(w.document.getElementById('switch').textContent,'Попробовать короткий план');
  await click(w,'#switch');assert.equal(w.location.hash,'#practice/'+lesson.id+'/plan');assert.equal(data(w).sessions[lesson.id+':plan'].assisted,true);
 }finally{w.close();}
});

for(const action of ['another','switch'])test('legacy '+action+' action refreshes and preserves a newer unfinished supported attempt',async()=>{
 const mode=action==='another'?'guided':'plan',storage=memory(),initial=State.create(lessons,storage);
 supported(initial,lesson,'plan');const dom=boot(lesson.id,'guided',snapshot(storage)),w=dom.window;
 try{
  w.document.getElementById('calm-toggle').click();
  complete(w,lesson.id,'guided');const second=w.ProfileState.create(w.ProfileLessons,w.localStorage),current=second.start(lesson.id,mode,true);
  if(mode==='guided'){current.step=1;current.answers=[String(lesson.tasks.find(t=>t.id===current.taskId).steps[0].answer)];}
  current.draft='other-tab supported draft';second.persist();const before=JSON.parse(w.localStorage.getItem(State.KEY));
  await click(w,'#'+action);const after=JSON.parse(w.localStorage.getItem(State.KEY));
  assert.equal(w.location.hash,'#practice/'+lesson.id+'/'+mode);
  assert.deepEqual(after.sessions[lesson.id+':'+mode],before.sessions[lesson.id+':'+mode]);assert.deepEqual(after.seen,before.seen);
  assert.equal(w.document.getElementById('answer').value,'other-tab supported draft');
 }finally{w.close();}
});

test('shared-board result keeps the original actions and never enters public handoff state logic',async()=>{
 const id='expr-powers',dom=boot(id,'guided',undefined,true),w=dom.window;
 try{
  complete(w,id,'guided');assert.equal(w.document.getElementById('independent-check'),null);
  assert.equal(w.document.getElementById('another').textContent,'Ещё задача по шагам');
  assert.equal(w.document.getElementById('another').classList.contains('quiet'),false);
  assert.equal(w.document.getElementById('switch').textContent,'Проверить себя');
  await click(w,'#switch');assert.equal(w.location.hash,'#practice/'+id+'/independent');
  assert.equal(data(w).sessions[id+':independent'].assisted,false);
 }finally{w.close();}
});
