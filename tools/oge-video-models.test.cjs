'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const api=require('../trainers/oge-video-models.js');
const graphs=require('../trainers/oge-video-graphs.js'),geometry=require('../trainers/oge-video-geometry.js');
const all=[...graphs,...geometry],base=path.resolve(__dirname,'..');
function fixture(task=11,query='',saved={}){
 const dom=new JSDOM(`<body><main><input id="native" value="draft"><button>Проверить</button></main><script data-oge-video-task="${task}"></script></body>`,{url:'https://mathexam.space/trainers/test.html'+query,runScripts:'outside-only'});
 const w=dom.window;Object.defineProperty(w.navigator,'locks',{value:{request(_key,fn){try{return Promise.resolve(fn());}catch(e){return Promise.reject(e);}}},configurable:true});for(const[k,v]of Object.entries(saved))w.localStorage.setItem(k,v);
 for(const f of ['oge-video-graphs.js','oge-video-geometry.js','oge-video-models.js'])w.eval(fs.readFileSync(path.join(base,'trainers',f),'utf8'));
 return {dom,w,d:w.document,close:()=>w.close()};
}
const click=(f,a)=>{const b=f.d.querySelector(`[data-ovm-action="${a}"]`);assert.ok(b,a);b.click();};
function choose(f,field,index){const r=f.d.querySelector(`input[name="ovm-${field}"][value="${index}"]`);r.checked=true;r.dispatchEvent(new f.w.Event('change',{bubbles:true}));}
function stage(f){return f.d.querySelector('[data-ovm-stage]').dataset.ovmStage;}
function pick(f,id){const p=f.d.querySelector('[data-ovm-picker]');p.value=id;p.dispatchEvent(new f.w.Event('change'));}
function begin(f,l){pick(f,l.id);choose(f,'prediction',l.predict.answer);click(f,'check-prediction');click(f,'experiment');assert.equal(stage(f),'experiment');click(f,'reason');choose(f,'reason',l.reason.answer);click(f,'check-reason');click(f,'practice');assert.equal(stage(f),'practice');}
function answer(f,text){const n=f.d.querySelector('[data-ovm-answer]');n.value=text;n.dispatchEvent(new f.w.Event('input',{bubbles:true}));click(f,'check-practice');}
function state(f,id){return JSON.parse(f.w.localStorage.getItem(api.PREFIX+id));}
function snapshot(w){return Object.fromEntries(Array.from({length:w.localStorage.length},(_,i)=>{const k=w.localStorage.key(i);return[k,w.localStorage.getItem(k)];}));}
test('strict numeric parsing accepts equivalence and rejects missing/unsafe/undefined expressions',()=>{
 for(const [a,b]of [['4,5',4.5],['9/2',4.5],['-6/-3',2],['−3/2',-1.5],['0',0],['.5',.5]])assert.ok(api.correct(a,b),a);
 for(const x of ['', ' ', '1/0','0/0','Infinity','NaN','2+3','1e4','<img>','1/2/3'])assert.equal(api.numberParts(x),null,x);
 assert.equal(api.correct('2',3),false);assert.equal(api.correct('0.333333333',1/3),false);
});
test('all ten lessons fit on nine public entries and all native DOM/storage stays unchanged',()=>{
 assert.equal(all.length,10);assert.equal(all.reduce((n,l)=>n+l.practices.length,0),30);
 for(const task of [11,15,16,17,19,22,23,24,25]){const f=fixture(task,'',{native:'{"draft":"keep"}'});try{assert.equal(f.d.querySelector('main').innerHTML,'<input id="native" value="draft"><button>Проверить</button>');assert.ok(f.d.querySelector('#oge-video-models'));assert.equal(f.d.querySelector('#oge-video-models').open,false);assert.deepEqual(snapshot(f.w),{native:'{"draft":"keep"}'});}finally{f.close();}}
});
test('every model completes a new independent answer and does not award native progress',()=>{
 for(const l of all){const f=fixture(l.tasks[0],'',{native:'keep'});try{begin(f,l);answer(f,String(l.practices[0].answer));assert.equal(state(f,l.id).results[0],'independent',l.id);assert.equal(f.w.localStorage.getItem('native'),'keep');assert.equal(f.w.localStorage.getItem('mathExamCourseProgress.v1'),null);assert.match(f.d.querySelector('[data-ovm-result]').textContent,/Самостоятельно/);}finally{f.close();}}
});
test('help, corrections and repeats never become a new clean independent result',()=>{
 const l=graphs[0],f=fixture(11);try{begin(f,l);answer(f,'1/0');assert.equal(state(f,l.id).wrong,false);answer(f,String(l.practices[0].answer+10));answer(f,String(l.practices[0].answer));assert.equal(state(f,l.id).results[0],'corrected');click(f,'next');click(f,'hint');answer(f,String(l.practices[1].answer));assert.equal(state(f,l.id).results[1],'helped');click(f,'next');answer(f,String(l.practices[2].answer));assert.equal(state(f,l.id).results[2],'independent');click(f,'next');assert.match(f.d.querySelector('.ovm-kicker').textContent,/Знакомый/);answer(f,String(l.practices[0].answer));assert.equal(state(f,l.id).results[0],'corrected');assert.equal(Object.keys(state(f,l.id).results).length,3);assert.match(f.d.querySelector('[data-ovm-result]').textContent,/повтор/);}finally{f.close();}
});
test('draft, proof, parameters and stage survive reload',()=>{
 const l=geometry.find(x=>x.id==='midpoints-common-circle'),f=fixture(24);let saved;try{begin(f,l);const t=f.d.querySelector('[data-ovm-proof]');t.value='CM — высота. Затем окружность.';t.dispatchEvent(new f.w.Event('input'));const a=f.d.querySelector('[data-ovm-answer]');a.value='10/2';a.dispatchEvent(new f.w.Event('input'));saved=snapshot(f.w);}finally{f.close();}
 const g=fixture(24,'',saved);try{assert.equal(stage(g),'practice');assert.equal(g.d.querySelector('[data-ovm-proof]').value,'CM — высота. Затем окружность.');assert.equal(g.d.querySelector('[data-ovm-answer]').value,'10/2');}finally{g.close();}
});
test('newer concurrent work wins without stale-tab overwrite',()=>{
 const l=graphs[0],f=fixture(11);try{begin(f,l);const newer=state(f,l.id);newer.rev+=5;newer.answer='newer';f.w.localStorage.setItem(api.PREFIX+l.id,JSON.stringify(newer));const a=f.d.querySelector('[data-ovm-answer]');a.value='stale';a.dispatchEvent(new f.w.Event('input'));assert.equal(state(f,l.id).answer,'newer');assert.equal(f.d.querySelector('[data-ovm-answer]').value,'newer');assert.match(f.d.querySelector('.ovm-notice').textContent,/другой вкладке/);}finally{f.close();}
});
test('shared, exam and managed queries suppress UI and all storage',()=>{
 for(const q of ['?board=1','?mirror=1','?embedded=1','?managed=1','?mode=exam']){const f=fixture(11,q,{native:'keep'});try{assert.equal(f.d.querySelector('#oge-video-models'),null);assert.deepEqual(snapshot(f.w),{native:'keep'});}finally{f.close();}}
 assert.equal(api.isolated({parent:{},location:{search:''}}),true);
});
test('unavailable and corrupt storage does not prevent practice or inject markup',async()=>{
 const l=graphs[0],f=fixture(11,'',{[api.PREFIX+l.id]:'{"rev":0,"stage":"<img>","params":{},"variant":999}'});try{assert.equal(stage(f),'prediction');Object.defineProperty(f.w,'localStorage',{get(){throw Error('denied');}});begin(f,l);answer(f,String(l.practices[0].answer));await Promise.resolve();await Promise.resolve();assert.match(f.d.querySelector('.ovm-notice').textContent,/недоступно/);}finally{f.close();}
});

test('skipped revealed and wrong variants retain their provenance and draft on return',()=>{
 for(const action of ['solution','wrong']){
  const l=graphs[0],f=fixture(11);try{begin(f,l);
   if(action==='solution')click(f,'solution');else answer(f,String(l.practices[0].answer+99));
   click(f,'next');assert.equal(state(f,l.id).variant,1);click(f,'next');assert.equal(state(f,l.id).variant,2);click(f,'next');assert.equal(state(f,l.id).variant,0);
   assert.match(f.d.querySelector('.ovm-kicker').textContent,/Знакомый/);
   answer(f,String(l.practices[0].answer));assert.equal(state(f,l.id).results[0],action==='solution'?'helped':'corrected');
  }finally{f.close();}
 }
});
test('a selected nonfirst lesson resumes its own unfinished work after reload',()=>{
 const l=graphs[1],f=fixture(11);let saved;try{begin(f,l);const n=f.d.querySelector('[data-ovm-answer]');n.value='7/2';n.dispatchEvent(new f.w.Event('input'));saved=snapshot(f.w);}finally{f.close();}
 const g=fixture(11,'',saved);try{assert.equal(g.d.querySelector('[data-ovm-picker]').value,l.id);assert.equal(g.d.querySelector('[data-ovm-answer]').value,'7/2');}finally{g.close();}
});

test('successful numeric checks update counts immediately and never certify a free proof',()=>{
 const l=geometry.find(x=>x.id==='midpoints-common-circle'),f=fixture(24);try{begin(f,l);answer(f,String(l.practices[0].answer));assert.match(f.d.querySelector('[data-ovm-stats]').textContent,/1 самостоятельно/);assert.match(f.d.querySelector('[data-ovm-result]').textContent,/Числовой ответ/);assert.match(f.d.querySelector('[data-ovm-result]').textContent,/Обоснование автоматически не проверено/);}finally{f.close();}
});

test('first visits are new conditions and a previously seen skipped condition is familiar',()=>{
 const l=graphs[0],f=fixture(11);try{begin(f,l);assert.match(f.d.querySelector('.ovm-kicker').textContent,/Новое условие 1/);click(f,'next');assert.match(f.d.querySelector('.ovm-kicker').textContent,/Новое условие 2/);click(f,'next');assert.match(f.d.querySelector('.ovm-kicker').textContent,/Новое условие 3/);click(f,'next');assert.match(f.d.querySelector('.ovm-kicker').textContent,/Знакомый пример/);}finally{f.close();}
});
test('changing a verified reason to an incorrect choice closes the practice gate',()=>{
 const l=graphs[0],f=fixture(11);try{choose(f,'prediction',l.predict.answer);click(f,'check-prediction');click(f,'experiment');click(f,'reason');choose(f,'reason',l.reason.answer);click(f,'check-reason');assert.equal(f.d.querySelector('[data-ovm-action=practice]').disabled,false);choose(f,'reason',(l.reason.answer+1)%l.reason.choices.length);assert.equal(f.d.querySelector('[data-ovm-action=practice]').disabled,true);click(f,'practice');assert.equal(stage(f),'reason');}finally{f.close();}
});

test('queued writes acquire one exclusive lock and reject an intervening foreign commit',async()=>{
 const l=graphs[0],f=fixture(11);try{begin(f,l);const jobs=[];Object.defineProperty(f.w.navigator,'locks',{value:{request(key,fn){jobs.push({key,fn});return Promise.resolve();}},configurable:true});
 const input=f.d.querySelector('[data-ovm-answer]');input.value='stale';input.dispatchEvent(new f.w.Event('input'));
 assert.equal(jobs.length,1);assert.equal(jobs[0].key,api.PREFIX+l.id);
 const fresh=state(f,l.id);fresh.rev++;fresh.answer='newer';f.w.localStorage.setItem(api.PREFIX+l.id,JSON.stringify(fresh));
 jobs[0].fn();assert.equal(state(f,l.id).answer,'newer');assert.equal(f.d.querySelector('[data-ovm-answer]').value,'newer');
 }finally{f.close();}
});
test('without exclusive browser locks practice stays usable without unsafe persistent writes',()=>{
 const l=graphs[0],f=fixture(11);try{Object.defineProperty(f.w.navigator,'locks',{value:undefined,configurable:true});begin(f,l);answer(f,String(l.practices[0].answer));assert.equal(f.w.localStorage.getItem(api.PREFIX+l.id),null);assert.match(f.d.querySelector('.ovm-notice').textContent,/недоступно/);}finally{f.close();}
});

function delayLocks(f){
 const jobs=[];Object.defineProperty(f.w.navigator,'locks',{value:{request(_key,fn){return new Promise((resolve,reject)=>jobs.push(()=>{try{resolve(fn());}catch(error){reject(error);}}));}},configurable:true});
 return {jobs,flush(){while(jobs.length)jobs.shift()();}};
}
test('pending keystrokes survive lesson switches and older commits do not replace later drafts',()=>{
 const l=graphs[0],f=fixture(11);try{begin(f,l);const queue=delayLocks(f),input=f.d.querySelector('[data-ovm-answer]');
 input.value='7';input.dispatchEvent(new f.w.Event('input'));input.value='7/3';input.dispatchEvent(new f.w.Event('input'));
 pick(f,graphs[1].id);pick(f,l.id);assert.equal(f.d.querySelector('[data-ovm-answer]').value,'7/3');
 click(f,'next');queue.jobs.shift()();assert.equal(state(f,l.id).answer,'7');queue.flush();
 assert.equal(state(f,l.id).drafts[0].answer,'7/3');click(f,'next');click(f,'next');queue.flush();
 assert.equal(f.d.querySelector('[data-ovm-answer]').value,'7/3');
 }finally{f.close();}
});
test('session-only work survives picker roundtrips and retains help until the page closes',()=>{
 const l=graphs[0],f=fixture(11);try{Object.defineProperty(f.w.navigator,'locks',{value:undefined,configurable:true});begin(f,l);
 const input=f.d.querySelector('[data-ovm-answer]');input.value='7/3';input.dispatchEvent(new f.w.Event('input'));click(f,'solution');
 pick(f,graphs[1].id);pick(f,l.id);assert.equal(f.d.querySelector('[data-ovm-answer]').value,'7/3');answer(f,String(l.practices[0].answer));
 assert.match(f.d.querySelector('[data-ovm-result]').textContent,/С помощью/);assert.equal(f.w.localStorage.getItem(api.PREFIX+l.id),null);
 }finally{f.close();}
});
test('exposed help and wrong attempts survive rejected pending saves, storage events, and reload',()=>{
 for(const kind of ['solution','wrong'])for(const event of [false,true]){
  const l=graphs[0],f=fixture(11);let saved;try{begin(f,l);const fresh=state(f,l.id),queue=delayLocks(f);
   if(kind==='solution'){click(f,'solution');assert.match(f.d.querySelector('[data-ovm-feedback]').textContent,/k = 2/);}else answer(f,'999');
   fresh.rev++;f.w.localStorage.setItem(api.PREFIX+l.id,JSON.stringify(fresh));
   if(event)f.w.dispatchEvent(new f.w.StorageEvent('storage',{key:api.PREFIX+l.id,newValue:JSON.stringify(fresh)}));
   queue.flush();saved=snapshot(f.w);assert.equal(saved[api.PREFIX+'exposure.'+l.id+'.0.'+(kind==='solution'?'helped':'wrong')],'1');
  }finally{f.close();}
  const g=fixture(11,'',saved);try{answer(g,String(l.practices[0].answer));assert.equal(state(g,l.id).results[0],kind==='solution'?'helped':'corrected');}finally{g.close();}
 }
});
test('foreign exposure markers are read before grading even before the other snapshot commits',()=>{
 const l=graphs[0],f=fixture(11);try{begin(f,l);answer(f,String(l.practices[0].answer));click(f,'hint');
 assert.equal(state(f,l.id).results[0],'independent','later help never downgrades an earned original result');
 click(f,'next');assert.equal(state(f,l.id).helped,false);
 // The answer was already typed; no intervening input/save may refresh the flags.
 const input=f.d.querySelector('[data-ovm-answer]');input.value=String(l.practices[1].answer);input.dispatchEvent(new f.w.Event('input'));
 f.w.localStorage.setItem(api.PREFIX+'exposure.'+l.id+'.1.helped','1');
 click(f,'check-practice');assert.equal(state(f,l.id).results[1],'helped');
 click(f,'next');const last=f.d.querySelector('[data-ovm-answer]');last.value=String(l.practices[2].answer);last.dispatchEvent(new f.w.Event('input'));
 f.w.localStorage.setItem(api.PREFIX+'exposure.'+l.id+'.2.wrong','1');click(f,'check-practice');assert.equal(state(f,l.id).results[2],'corrected');
 click(f,'next');assert.match(f.d.querySelector('.ovm-kicker').textContent,/Знакомый/);click(f,'hint');answer(f,String(l.practices[0].answer));
 assert.equal(state(f,l.id).results[0],'independent');assert.match(f.d.querySelector('[data-ovm-result]').textContent,/Знакомый повтор/);
 }finally{f.close();}
});
