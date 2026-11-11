'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom'),{resolvePublicScript}=require('./public-page-script.cjs');
const State=require('../ege-profil/start/state.js');
const lessons=require('../ege-profil/start/equations-data.js'),lesson=lessons.find(l=>l.id==='eq-linear'),key='eq-linear:independent';
const root=path.resolve(__dirname,'..');
function memory(seed){let value=seed?JSON.stringify(seed):null;return {getItem:k=>k===State.KEY?value:null,setItem:(k,v)=>{if(k===State.KEY)value=v;}};}
function data(storage){return JSON.parse(storage.getItem(State.KEY));}
function state(storage){return State.create(lessons,storage,{publicAttempts:true});}
function send(st,s,value,correct,mode='independent'){s.draft=value;st.submitTrace(lesson.id,mode,s,value,correct);if(correct)s.answers[mode==='guided'?s.step:0]=value;else s.wrong=true;st.persist();}

test('first wrong answer survives correction and reload without independent credit',()=>{
 const storage=memory(),st=state(storage),s=st.start(lesson.id,'independent');send(st,s,'999999',false);const first=structuredClone(s.submissions.steps[0].first);
 st.noteHelp(s);s.assisted=true;send(st,s,'12/4',true);st.finish(lesson.id,'independent',s);
 const loaded=state(storage).data.sessions[key];assert.deepEqual(loaded.submissions.steps[0].first,first);
 assert.equal(loaded.submissions.steps[0].last.answer,'12/4');assert.equal(loaded.submissions.steps[0].last.help,'support');assert.equal(loaded.wrong,true);
 assert.deepEqual(data(storage).records[lesson.id].independent,[]);
});
test('first and latest submissions retain help context separately, including full solution',()=>{
 const storage=memory(),st=state(storage),s=st.start(lesson.id,'guided');send(st,s,'-99',false,'guided');st.noteHelp(s,'solution');st.persist();send(st,s,'2',true,'guided');
 s.step++;s.draft='';send(st,s,'3',true,'guided');const trace=state(storage).data.sessions['eq-linear:guided'].submissions;
 assert.equal(trace.steps[0].first.help,'none');assert.equal(trace.steps[0].last.help,'solution');assert.equal(trace.steps[1].first.help,'solution');
 assert.equal(trace.fromStart,true);assert.equal(trace.steps.length,2);
});
test('cross-tab correction preserves the already committed first answer',()=>{
 const storage=memory(),a=state(storage),sa=a.start(lesson.id,'independent'),b=state(storage),sb=b.start(lesson.id,'independent');
 send(a,sa,'101',false);const first=structuredClone(sa.submissions.steps[0].first);
 send(b,sb,'202',false);a.persist();send(a,sa,'303',true);
 const trace=data(storage).sessions[key].submissions;assert.deepEqual(trace.steps[0].first,first);assert.equal(trace.steps[0].last.answer,'303');
 assert.equal(data(storage).sessions[key].wrong,true);
});
test('legacy sessions do not acquire invented first-attempt history',()=>{
 const storage=memory(),old=State.create(lessons,storage),s=old.start(lesson.id,'independent');s.wrong=true;s.draft='old draft';old.persist();
 const st=state(storage),active=st.start(lesson.id,'independent');send(st,active,'3',true);
 assert.equal(active.submissions.fromStart,false);assert.equal(active.submissions.steps[0].first.answer,'3');assert.equal(active.wrong,true);
});
test('malformed optional trace remains intact while the core draft stays usable',()=>{
 const storage=memory(),old=State.create(lessons,storage);old.start(lesson.id,'independent');const seed=data(storage),broken={version:99,valuable:['keep']};seed.sessions[key].submissions=broken;storage.setItem(State.KEY,JSON.stringify(seed));
 const st=state(storage),s=st.start(lesson.id,'independent');send(st,s,'7',false);
 assert.match(st.warning,/История первых ответов повреждена/);assert.deepEqual(data(storage).sessions[key].submissions,broken);assert.equal(data(storage).sessions[key].draft,'7');
 assert.equal(s.submissions,undefined);
});
test('optional trace is bounded and cannot follow a stale attempt into a fresh condition',()=>{
 const storage=memory(),st=state(storage),old=st.start(lesson.id,'independent');send(st,old,'1'.repeat(1000),false);assert.equal(old.submissions.steps[0].first.answer.length,200);
 const fresh=st.start(lesson.id,'independent',true);assert.equal(st.submitTrace(lesson.id,'independent',old,'9',true),false);assert.equal(fresh.submissions.steps.length,0);
});
test('a stale legacy tab cannot attach a previous condition history to a replacement attempt',()=>{
 const storage=memory(),st=state(storage),s=st.start(lesson.id,'independent');send(st,s,'101',false);
 const seed=data(storage),oldTrace=structuredClone(seed.sessions[key].submissions);seed.sessions[key].taskId=lesson.tasks.at(-1).id;seed.sessions[key].started='2026-11-10T00:00:00.000Z';storage.setItem(State.KEY,JSON.stringify(seed));
 const reloaded=state(storage),next=reloaded.start(lesson.id,'independent');assert.equal(next.submissions,undefined);assert.equal(reloaded.warning,'');assert.deepEqual(data(storage).sessions[key].submissions,oldTrace);send(reloaded,next,'202',false);assert.equal(next.submissions.fromStart,false);assert.equal(next.submissions.steps[0].first.answer,'202');assert.equal(next.submissions.taskId,next.taskId);assert.equal(next.submissions.started,next.started);const fresh=reloaded.start(lesson.id,'independent',true);assert.equal(fresh.submissions.fromStart,true);assert.equal(fresh.submissions.steps.length,0);
});
test('trace reload projects bounded event fields and rejects unbounded timestamps without erasing raw data',()=>{
 const storage=memory(),st=state(storage),s=st.start(lesson.id,'independent');send(st,s,'101',false);let seed=data(storage);seed.sessions[key].submissions.steps[0].first.extra={private:'discard from admitted trace'};storage.setItem(State.KEY,JSON.stringify(seed));
 const loaded=state(storage);loaded.persist();assert.equal(loaded.data.sessions[key].submissions.steps[0].first.extra,undefined);
 seed=data(storage);seed.sessions[key].submissions.steps[0].first.at=' '.repeat(40)+'2026-11-09';const raw=structuredClone(seed.sessions[key].submissions);storage.setItem(State.KEY,JSON.stringify(seed));const bad=state(storage);bad.persist();assert.equal(bad.data.sessions[key].submissions,undefined);assert.deepEqual(data(storage).sessions[key].submissions,raw);
});
test('default/board state creates no trace and trace helpers do not change credit or state',()=>{
 const storage=memory(),st=State.create(lessons,storage),s=st.start(lesson.id,'independent'),before=storage.getItem(State.KEY);
 st.noteHelp(s,'solution');assert.equal(st.submitTrace(lesson.id,'independent',s,'9',false),false);assert.equal(s.submissions,undefined);assert.equal(storage.getItem(State.KEY),before);
});
function boot(mode='independent',seed,board=false){
 const file=path.join(root,board?'trainers/ege-profile-expressions.html':'ege-profil/start/index.html');
 const dom=new JSDOM(fs.readFileSync(file,'utf8'),{url:'https://mathexam.space/'+path.relative(root,file)+'#practice/'+(board?'expr-power-rational':'eq-linear')+'/'+mode,runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};if(seed)w.localStorage.setItem(State.KEY,JSON.stringify(seed));
 for(const script of w.document.querySelectorAll('script[src]')){const filename=resolvePublicScript(root,path.dirname(file),script.getAttribute('src'));if(board&&filename.endsWith('/app.js'))w.MathExamBoard={register(){}};w.eval(fs.readFileSync(filename,'utf8'));}
 return dom;
}
function submit(w,value){const d=w.document,input=d.querySelector('#answer-form input[type=text]');input.value=value;input.dispatchEvent(new w.Event('input',{bubbles:true}));d.querySelector('#answer-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));}
function snapshot(w){return JSON.parse(w.localStorage.getItem(State.KEY));}

test('public UI shows first error and correction after reload and finishing, with equivalent numeric input accepted',()=>{
 let dom=boot(),w=dom.window;
 try{
  submit(w,'999999');const first=w.document.querySelector('[data-submission-first]').textContent;assert.match(first,/999999 — нужна правка/);assert.equal(w.document.querySelector('#submission-history').hidden,false);
  w.document.querySelector('#hint').click();const task=w.ProfileLessons.find(l=>l.id==='eq-linear').tasks.find(t=>t.id===snapshot(w).sessions[key].taskId);submit(w,String(task.answer*2)+'/2');
  assert.match(w.document.querySelector('#feedback').textContent,/Верно/);assert.equal(w.document.querySelector('[data-submission-first]').textContent,first);assert.match(w.document.querySelector('[data-submission-latest]').textContent,/после подсказки/);assert(w.document.querySelector('[data-submission-latest]').textContent.includes(String(task.answer*2)+'/2'));
  const saved=snapshot(w);w.close();dom=boot('independent',saved);w=dom.window;
  assert.equal(w.document.querySelector('[data-submission-first]').textContent,first);w.document.querySelector('#next').click();assert(w.document.querySelector('.result-panel'));assert.equal(w.document.querySelector('[data-submission-first]').textContent,first);assert.deepEqual(snapshot(w).records['eq-linear'].independent,[]);
 }finally{w.close();}
});
test('empty and invalid notation are not recorded as mathematical submissions',()=>{
 const dom=boot(),w=dom.window;try{submit(w,'');submit(w,'3π/');assert.equal(snapshot(w).sessions[key].submissions.steps.length,0);assert.equal(snapshot(w).sessions[key].wrong,false);assert.equal(w.document.querySelector('#submission-history').hidden,true);}finally{w.close();}
});
test('board wrapper does not render public submission history',()=>{
 const dom=boot('guided',undefined,true),w=dom.window;try{assert.equal(w.document.querySelector('#submission-history'),null);assert(!w.document.body.textContent.includes('Мои ответы и исправления'));}finally{w.close();}
});
