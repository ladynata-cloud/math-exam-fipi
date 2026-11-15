'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const model=require('../oge/learning-map.js');
const ROOT=path.resolve(__dirname,'..');
const KEY=model.KEY,DAY=24*60*60*1000,NOW=1800000000000;
const IDS={11:'oge-t11-grafiki',22:'oge-t22-grafiki',24:'oge24-dokazatelstva'};
function attempt(id,outcome='independent',at=NOW-1000,extra={}) {
 return {id,skill:'graphs',taskKey:'condition-'+id,at,outcome,helpUsed:outcome==='helped',fresh:outcome!=='familiar',...extra};
}
function record(attempts,extra={}) {return {v:1,solvedByType:{},ext:{auditLearning:{v:1,attempts,...extra}}};}
function store(seed) {
 const raw=JSON.stringify(seed),writes=[];
 return {raw,writes,getItem:key=>key===KEY?raw:null,setItem(...args){writes.push(args);throw Error('read-only');},removeItem(){throw Error('read-only');}};
}
function snapshot(seed,now=NOW){return model.snapshot(store(seed),now);}
function step(view,n){return view.steps.find(s=>s.id==='task-'+n);}
function boot(seed) {
 const dom=new JSDOM(fs.readFileSync(path.join(ROOT,'trainers/oge-course/index.html'),'utf8'),{url:'https://mathexam.space/trainers/oge-course/',runScripts:'outside-only'});
 const w=dom.window;w.localStorage.setItem(KEY,JSON.stringify(seed));
 for(const file of ['oge/registry.js','oge/learning-map.js','oge/learning-map-view.js'])w.eval(fs.readFileSync(path.join(ROOT,file),'utf8'));
 return dom;
}

test('old skill counters and assisted legacy results do not become new independent evidence',()=>{
 const view=snapshot({[IDS[11]]:{solvedByType:{t43:30},ext:{skills:{oge:{total:30,first:30}}}},[IDS[24]]:{solvedByType:{t1:50}}});
 for(const n of [11,24]){assert.equal(step(view,n).evidence,null);assert.doesNotMatch(step(view,n).label,/самостоятель|освоен/);}
 assert.equal(model.recommendPractice(view),null);
});

test('an unfinished saved action can be continued without inventing any successful result',()=>{
 const row=record([],{resume:{at:NOW-100,hasWork:true,unfinished:true}});
 const seed={[IDS[22]]:row},storage=store(seed),view=model.snapshot(storage,NOW),s=step(view,22);
 assert.equal(s.hasDraft,true);assert.equal(s.started,true);assert.equal(s.activity,0);assert.equal(s.evidence.total,0);
 assert.equal(model.recommend(view,null).step.id,'task-22');assert.equal(model.recommendPractice(view),null);
 assert.deepEqual(storage.writes,[]);
 for(const resume of [{at:NOW,hasWork:false,unfinished:true},{at:NOW,hasWork:true,unfinished:false},{at:NOW+2*DAY,hasWork:true,unfinished:true}]) {
  const next=snapshot({[IDS[22]]:record([],{resume})});
  assert.equal(step(next,22).hasDraft,false);assert.equal(step(next,22).started,false);
 }
});

test('every updated trainer exposes the same separate facts without changing legacy data',()=>{
 const seed={'foreign-course':{v:1,solvedByType:{a:9},ext:{keep:['literal']}}};
 for(const n of [11,22,24])seed[IDS[n]]=record([attempt('one'),attempt('two','corrected'),attempt('three','helped'),attempt('four','familiar')]);
 const storage=store(seed),view=model.snapshot(storage,NOW);
 for(const n of [11,22,24]) {
  const s=step(view,n),e=s.evidence;
  assert.equal(s.started,true);assert.equal(e.total,4);
  assert.deepEqual([e.independent,e.corrected,e.helped,e.familiar],[1,1,1,1]);
  assert.equal(e.afterPause,0);assert.equal(s.updatedAt,NOW-1000);
 }
 assert.deepEqual(storage.writes,[]);assert.equal(storage.raw,JSON.stringify(seed));
});

test('help in an unfinished task survives opening another topic without counting a completion',()=>{
 const seed={[IDS[22]]:record([],{resume:{at:NOW-1000,hasWork:true,unfinished:true,helpUsed:true,skill:'m3:shift_h'}})};
 const storage=store(seed),view=model.snapshot(storage,NOW);
 assert.equal(model.recommend(view,{stepId:'task-11',at:NOW}).step.id,'task-11');
 assert.equal(model.recommendPractice(view).step.id,'task-22');
 assert.equal(model.recommendPractice(view).reason,'helped');
 const e=step(view,22).evidence;
 assert.deepEqual([e.total,e.independent,e.corrected,e.helped,e.familiar],[0,0,0,0,0]);
 assert.deepEqual(storage.writes,[]);
});

test('continuation and the next useful practice remain distinct when a newer topic was opened',()=>{
 const seed={
  [IDS[22]]:record([attempt('needed-help','helped',NOW-10000)]),
  [IDS[11]]:record([attempt('later-answer','independent',NOW-1000)])
 };
 const view=snapshot(seed),cursor={stepId:'task-11',at:NOW};
 assert.equal(model.recommend(view,cursor).step.id,'task-11');
 const practice=model.recommendPractice(view);assert.equal(practice.step.id,'task-22');assert.equal(practice.reason,'helped');
 seed[IDS[22]].ext.auditLearning.attempts.push(attempt('new-condition','independent',NOW-100));
 assert.equal(model.recommendPractice(snapshot(seed)),null,'A new independent condition resolves this recommendation');
});

test('a familiar repeat after assistance is not independent transfer and still calls for a new condition',()=>{
 const a=attempt('help','helped',NOW-2000,{taskKey:'same'});
 const b=attempt('repeat','familiar',NOW-1000,{taskKey:'same'});
 const view=snapshot({[IDS[24]]:record([a,b])}),e=step(view,24).evidence;
 assert.equal(e.independent,0);assert.equal(e.familiar,1);assert.equal(e.helped,1);
 assert.equal(model.recommendPractice(view).reason,'helped');
});

test('a different id or a shuffled proof cannot manufacture fresh independent credit',()=>{
 const a=attempt('first','helped',NOW-2000,{taskKey:'t2'});
 const b=attempt('another-id','independent',NOW-1000,{taskKey:'t2'});
 const e=step(snapshot({[IDS[24]]:record([b,a])}),24).evidence;
 assert.equal(e.independent,0);assert.equal(e.familiar,1);assert.equal(e.helped,1);
});

test('after-pause evidence requires another condition and a full day after the last mathematical help',()=>{
 const first=attempt('first','independent',NOW-3*DAY);
 let rows=[first,attempt('later','corrected',NOW-1000)];
 let view=snapshot({[IDS[11]]:record(rows)});
 assert.equal(step(view,11).evidence.afterPause,1);
 assert.equal(model.recommendPractice(view),null,'A just-finished independent check is not due');
 rows=[first,attempt('assistance','helped',NOW-2*60*60*1000),attempt('later','independent',NOW-1000)];
 assert.equal(step(snapshot({[IDS[11]]:record(rows)}),11).evidence.afterPause,0);
 rows=[first,attempt('repeat','familiar',NOW-1000,{taskKey:first.taskKey})];
 assert.equal(step(snapshot({[IDS[11]]:record(rows)}),11).evidence.afterPause,0);
 const due=model.recommendPractice(snapshot({[IDS[11]]:record([first])}));
 assert.equal(due.reason,'after-pause');assert.equal(due.at,first.at+DAY);
});

test('one millisecond before a day is not a delayed check',()=>{
 const first=attempt('a','independent',NOW-DAY),second=attempt('b','independent',NOW-1);
 assert.equal(step(snapshot({[IDS[22]]:record([first,second])}),22).evidence.afterPause,0);
 second.at=NOW;
 assert.equal(step(snapshot({[IDS[22]]:record([first,second])}),22).evidence.afterPause,1);
});

test('unknown, future, inconsistent or conflicting records cannot inflate new results',()=>{
 const good=attempt('a'),rows=[good,{...good},attempt('future','independent',NOW+100000),
  attempt('false-independence','independent',NOW-1000,{helpUsed:true}),
  attempt('false-freshness','independent',NOW-1000,{fresh:false}),
  attempt('unknown','mastered'),attempt('bad-time','independent',NaN),{id:'incomplete'}];
 let view=snapshot({[IDS[11]]:record(rows)});
 assert.equal(view.invalidData,true);assert.equal(step(view,11).evidence.independent,1);
 rows.push({...good,outcome:'helped',helpUsed:true});
 view=snapshot({[IDS[11]]:record(rows)});
 assert.equal(step(view,11).evidence.total,0,'Conflicting duplicate identity is not proof of any outcome');
 const oversized=record(Array.from({length:101},(_,i)=>attempt(String(i))));
 assert.equal(step(snapshot({[IDS[11]]:oversized}),11).evidence,null);
 for(const broken of [{v:2,attempts:[]},{v:1,attempts:{}},'<script>']) {
  const rec=record([]);rec.ext.auditLearning=broken;
  view=snapshot({[IDS[11]]:rec});assert.equal(view.invalidData,true);assert.equal(step(view,11).evidence,null);
 }
});

test('existing open errors can recommend work without claiming that old attempts establish mastery',()=>{
 const view=snapshot({mistakes:{[IDS[11]+'|t44']:{w:2,r:1,lastWrong:NOW-1000},[IDS[11]+'|invented']:{w:100,r:0,lastWrong:NOW}}});
 const s=step(view,11),p=model.recommendPractice(view);
 assert.equal(s.openMistakes,1);assert.equal(p.step.id,'task-11');assert.equal(p.reason,'mistakes');assert.equal(s.evidence,null);
});

test('view presents actionable recommendation and exact categories without writing results or rendering stored text',()=>{
 const now=Date.now(),seed={[IDS[22]]:record([attempt('help','helped',now-5000,{skill:'<img src=x onerror=alert(1)>',taskKey:'<script>bad()</script>'})]),[IDS[11]]:record([attempt('own','independent',now-1000)])};
 const dom=boot(seed),w=dom.window,d=w.document;
 try {
  const before=JSON.stringify(seed);
  assert.equal(d.getElementById('course-continue').dataset.courseStep,'task-11');
  assert.equal(d.getElementById('course-practice').hidden,false);
  assert.equal(d.getElementById('course-practice-link').dataset.courseStep,'task-22');
  assert.match(d.getElementById('course-practice-note').textContent,/подсказка/);
  assert.match(d.querySelector('[data-course-step="task-22"] .course-step-evidence').textContent,/С помощью: 1/);
  assert.equal(d.querySelector('#learning-map img'),null);assert.doesNotMatch(d.getElementById('learning-map').textContent,/bad\(\)|onerror/);
  assert.equal(w.localStorage.getItem(KEY),before);
  const link=d.getElementById('course-practice-link');link.focus();w.dispatchEvent(new w.Event('storage'));
  assert.equal(d.activeElement,link,'Refreshing retains focus on the separate recommendation');
  assert.equal(w.localStorage.getItem(KEY),before);
 } finally {w.close();}
});

test('explicit continuation returns to the saved unfinished work without changing ordinary topic links',()=>{
 const seed={[IDS[22]]:record([],{resume:{at:Date.now()-1000,hasWork:true,unfinished:true,helpUsed:true,skill:'m3:shift_h'}})};
 const dom=boot(seed),d=dom.window.document;
 try{
  for(const id of ['course-continue','course-practice-link'])assert.equal(d.getElementById(id).getAttribute('href'),'/trainers/oge-task22-functions-graphs.html?resume=1');
  assert.equal(d.querySelector('#course-track-list [data-course-step="task-22"]').getAttribute('href'),'/trainers/oge-task22-functions-graphs.html');
  assert.match(d.getElementById('course-next-note').textContent,/сохранённого условия и своего ввода/);
 }finally{dom.window.close();}
});
