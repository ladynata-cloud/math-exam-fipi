'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const Checkpoint=require('../ege-profil/start/checkpoint.js');
const State=require('../ege-profil/start/state.js');
const Check=require('../ege-profil/start/checks.js');
const lessons=Array.from({length:13},(_,i)=>({id:'lesson-'+(i+1),position:i+1,title:'Number '+(i+1),tasks:Array.from({length:6},(_,j)=>({id:'task-'+(i+1)+'-'+(j+1),prompt:'Compute '+(i+1)+' + '+(j+1),answer:i+j+2,steps:[{answer:i+j+2}]}))}));
function memory(){const values=new Map();return {getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key),values};}
function setup(storage=memory(),list=lessons){const state=State.create(list,storage);return {storage,state,checkpoint:Checkpoint.create(list,storage,state)};}
function complete(checkpoint,answer='0'){
 checkpoint.startRound();
 for(let i=0;i<13;i++){
  const current=checkpoint.current();
  if(current.complete)break;
  if(!current.unavailable)checkpoint.submit(answer,Check.check);
  checkpoint.next();
 }
 return checkpoint.snapshot();
}

test('opens one unseen independent condition; reload preserves the same draft and exposure count',()=>{
 const {checkpoint:c,storage,state}=setup();
 assert.equal(c.snapshot().round,null,'snapshot does not start or expose a question');
 const first=c.startRound();
 assert.equal(first.number,4);assert.equal(first.position,0);assert.equal(first.total,13);
 assert.equal(first.task.id,'task-4-4');assert.equal(state.data.seen[first.task.id],1);
 assert.equal(Object.keys(state.data.seen).length,1,'future conditions not consumed');
 c.persistDraft('7/2');
 for(let i=0;i<4;i++)assert.equal(c.current().task.id,first.task.id);
 const reloaded=setup(storage);
 assert.equal(reloaded.checkpoint.current().draft,'7/2');
 assert.equal(reloaded.state.data.seen[first.task.id],1);
 assert.equal(reloaded.checkpoint.startRound(true).task.id,first.task.id,'fresh cannot drop unfinished work');
});

test('first valid wrong answer cannot turn into a scored success after retry or help',()=>{
 const {checkpoint:c}=setup();const first=c.startRound();
 c.submit(' ',Check.check);assert.equal(c.current().submitted,false);
 assert.equal(c.next().task.id,first.task.id,'unanswered task cannot be silently skipped');
 c.submit('0',Check.check);
 c.submit('8',Check.check);c.persistDraft('8');c.help();
 assert.equal(c.current().submitted,true);assert.equal(c.current().correct,false);
 assert.equal(c.current().draft,'0');assert.equal(c.current().assisted,false);
 assert.equal(c.snapshot().summary.independent,0);
});

test('a surviving checkpoint restores its current exposure marker when the separate lesson save is lost',()=>{
 const {checkpoint:c,storage}=setup();const first=c.startRound();
 storage.removeItem(State.KEY);
 const recovered=setup(storage);
 assert.equal(recovered.checkpoint.current().task.id,first.task.id);
 assert.equal(recovered.state.data.seen[first.task.id],1);
 assert.equal(recovered.state.start('lesson-4','independent').taskId,'task-4-5');
});

test('help before first answer records assisted work, help after correct answer does not erase success',()=>{
 const a=setup().checkpoint;a.startRound();a.help();a.submit('8',Check.check);
 assert.equal(a.current().correct,true);assert.equal(a.current().assisted,true);
 assert.equal(a.snapshot().summary.assisted,1);assert.equal(a.snapshot().summary.independent,0);
 const b=setup().checkpoint;b.startRound();b.submit('8',Check.check);b.help();
 assert.equal(b.current().assisted,false);assert.equal(b.snapshot().summary.independent,1);
});

test('rejects invalid checker results and thrown checks without recording a failed attempt',()=>{
 const {checkpoint:c}=setup();c.startRound();
 for(const check of [undefined,()=>undefined,()=>null,()=>{throw Error('unavailable');}]){
  c.submit('8',check);assert.equal(c.current().submitted,false);
 }
 c.submit('8',Check.check);assert.equal(c.current().correct,true);
});

test('all 13 numbers are sampled in order with separate immutable first-attempt results',()=>{
 const {checkpoint:c,state}=setup();const visited=[];
 c.startRound();
 for(let i=0;i<13;i++){
  const cur=c.current();visited.push(cur.number);
  if(i===1)c.help();
  c.submit(String(cur.number+4),Check.check);
  c.next();
 }
 assert.deepEqual(visited,Checkpoint.ORDER);assert.equal(new Set(visited).size,13);
 const saved=c.snapshot();assert.equal(saved.round.complete,true);assert.equal(saved.round.index,13);
 assert.equal(saved.summary.attempted,13);assert.equal(saved.summary.independent,12);assert.equal(saved.summary.assisted,1);
 assert.equal(saved.history.length,1);assert.deepEqual(state.data.records,{},'checkpoint does not declare lesson mastery');
 assert.equal(c.next().complete,true);assert.equal(c.startRound().complete,true);
 assert.equal(c.startRound(true).task.id,'task-4-5');assert.equal(c.snapshot().history.length,1);
});

test('lazy selection sees conditions opened in ordinary practice after a round began',()=>{
 const {checkpoint:c,storage}=setup();c.startRound();
 const secondTab=State.create(lessons,storage);
 const independentlyShown=secondTab.start('lesson-7','independent');
 assert.equal(independentlyShown.taskId,'task-7-4');
 c.submit('8',Check.check);const next=c.next();
 assert.equal(next.number,7);assert.equal(next.task.id,'task-7-5');
 assert.equal(setup(storage).state.data.seen['task-7-4'],1);
});

test('searches all lessons for a number, never reuses a previously exposed condition as new',()=>{
 const additional={...lessons[3],id:'other-4',tasks:lessons[3].tasks.map(t=>({...t,id:'other-'+t.id}))};
 const {state,checkpoint:c}=setup(memory(),[...lessons,additional]);
 for(const t of lessons[3].tasks.slice(-3))state.data.seen[t.id]=1;
 state.persist();
 assert.equal(c.startRound().lesson.id,'other-4');
 assert.equal(c.current().task.id,'other-task-4-4');
});

test('exhausted pools remain unavailable and cannot award false successes',()=>{
 const {state,checkpoint:c}=setup();
 for(const l of lessons)for(const t of l.tasks.slice(-3))state.data.seen[t.id]=1;
 state.persist();const first=c.startRound();
 assert.equal(first.unavailable,true);assert.equal(first.task,null);
 c.help();c.submit('8',()=>true);assert.equal(c.current().submitted,false);
 const result=complete(c);
 assert.equal(result.round.complete,true);assert.equal(result.summary.unavailable,13);
 assert.equal(result.summary.attempted,0);assert.equal(result.summary.independent,0);
});

test('completed history is bounded and snapshots/exports contain only inputs and result metadata',()=>{
 const {checkpoint:c,storage}=setup();
 for(let i=0;i<24;i++){c.startRound(true);complete(c);}
 const snapshot=c.snapshot();assert.equal(snapshot.history.length,20);
 assert.equal(new Set(snapshot.history.map(r=>r.id)).size,20);
 snapshot.history[0].items[0].draft='external mutation';
 assert.notEqual(c.snapshot().history[0].items[0].draft,'external mutation');
 const raw=storage.getItem(Checkpoint.KEY);
 assert(!/"(?:answer|steps|explanation|prompt|meta)"\s*:/.test(raw));
 assert.equal(c.export().storage,'local-browser');
 assert.equal(setup(storage).checkpoint.snapshot().history.length,20,'all retained rounds reload');
});

test('another tab can resume a draft and submitted result without re-exposing or overwriting it',()=>{
 const {checkpoint:a,storage}=setup();a.startRound();
 const {checkpoint:b}=setup(storage);b.current();
 a.persistDraft('8');assert.equal(b.current().draft,'8');
 a.submit('8',Check.check);b.submit('0',Check.check);
 assert.equal(b.current().correct,true);assert.equal(b.current().draft,'8');
 a.next();
 const returned=b.persistDraft('stale answer from old screen');
 assert.equal(returned.number,7);assert.equal(returned.draft,'');
 assert.equal(setup(storage).checkpoint.current().draft,'');
});

test('a stale tab cannot overwrite a newer current round',()=>{
 const {checkpoint:a,storage}=setup();a.startRound();
 const b=setup(storage).checkpoint;b.current();
 complete(a);a.startRound(true);const before=storage.getItem(Checkpoint.KEY);
 const current=b.submit('0',Check.check);
 assert.equal(current.number,4);assert.equal(current.task.id,'task-4-5');
 assert.equal(current.submitted,false);assert.equal(storage.getItem(Checkpoint.KEY),before);
});

test('render-bound tokens reject every stale action even after a rejected draft synced internal state',()=>{
 const {checkpoint:a,storage}=setup();const screen=a.startRound();
 const b=setup(storage).checkpoint;const current=b.current();
 assert.equal(typeof screen.token,'string');assert.equal(current.token,screen.token);
 b.submit('8',Check.check,current.token);b.next(current.token);
 const nextScreen=b.current();assert.notEqual(nextScreen.token,screen.token);
 const rejected=a.persistDraft('8',screen.token);
 assert.equal(rejected.token,nextScreen.token,'caller can redraw the updated screen');
 // Simulate a UI that ignored the returned screen and still dispatches handlers
 // from its old DOM. Updating the model alone must not authorize those handlers.
 a.submit('8',Check.check,screen.token);a.help(screen.token);a.next(screen.token);
 const saved=a.current();
 assert.equal(saved.number,7);assert.equal(saved.submitted,false);
 assert.equal(saved.assisted,false);assert.equal(saved.draft,'');
 assert.equal(setup(storage).checkpoint.current().token,nextScreen.token);
 a.persistDraft('11',saved.token);a.submit('11',Check.check,saved.token);
 assert.equal(a.current().correct,true,'actions from the new render are accepted');
});

test('a failed answer write latches in-memory recovery and export cannot lose it to a remote draft',()=>{
 const storage=memory();const originalSet=storage.setItem;
 const {checkpoint:c}=setup(storage);const first=c.startRound();
 const previousRaw=storage.getItem(Checkpoint.KEY);
 storage.setItem=(key,value)=>{if(key===Checkpoint.KEY)throw Error('quota');originalSet(key,value);};
 c.submit('8',Check.check,first.token);
 assert(c.warning);assert.equal(c.current().correct,true);
 assert.equal(c.original,previousRaw,'previous persistent save remains available');
 // A second browser tab can still write through its own Storage object.
 const remote=JSON.parse(previousRaw);remote.round.items[0].draft='0';
 originalSet(Checkpoint.KEY,JSON.stringify(remote));
 const exported=c.export();
 assert.equal(exported.round.items[0].submitted,true);
 assert.equal(exported.round.items[0].draft,'8');assert.equal(exported.summary.independent,1);
 c.next(first.token);assert.equal(c.current().number,7);
 assert.equal(JSON.parse(storage.getItem(Checkpoint.KEY)).round.items[0].draft,'0','recovering tab leaves remote save intact');
});

test('render token is rechecked if another tab advances between the two storage reads',()=>{
 const {checkpoint:a,storage}=setup();const screen=a.startRound();
 const previousRaw=storage.getItem(Checkpoint.KEY);
 const b=setup(storage).checkpoint;b.current();b.submit('8',Check.check);b.next();
 const nextRaw=storage.getItem(Checkpoint.KEY);storage.setItem(Checkpoint.KEY,previousRaw);
 const originalGet=storage.getItem;let reads=0;
 storage.getItem=key=>{
  if(key===Checkpoint.KEY&&++reads===2)storage.setItem(Checkpoint.KEY,nextRaw);
  return originalGet(key);
 };
 const result=a.submit('8',Check.check,screen.token);
 assert.equal(result.number,7);assert.equal(result.submitted,false);
 assert.equal(storage.getItem(Checkpoint.KEY),nextRaw);
});

test('unknown versions and malformed task references are retained without overwrite',()=>{
 const good=setup();good.checkpoint.startRound();
 const variants=[{version:99,round:null,history:[]},JSON.parse(good.storage.getItem(Checkpoint.KEY)),JSON.parse(good.storage.getItem(Checkpoint.KEY)),JSON.parse(good.storage.getItem(Checkpoint.KEY))];
 variants[1].round.items[0].taskId='task-4-1'; // guided pool is not valid here
 variants[2].round.items[0].lessonId='missing';
 variants[3].round.complete=true;
 for(const value of variants){
  const storage=memory(),raw=JSON.stringify(value);storage.setItem(Checkpoint.KEY,raw);
  const {checkpoint:c}=setup(storage);assert(c.warning);c.startRound();c.submit('8',Check.check);c.next();
  assert.equal(storage.getItem(Checkpoint.KEY),raw);assert.equal(c.original,raw);
 }
});

test('mid-session malformed storage is protected while current in-memory work can continue',()=>{
 const {checkpoint:c,storage}=setup();c.startRound();
 storage.setItem(Checkpoint.KEY,'{broken');c.submit('8',Check.check);
 assert(c.warning);assert.equal(storage.getItem(Checkpoint.KEY),'{broken');
 assert.equal(c.current().correct,true);
});

test('unavailable storage uses a recoverable in-memory round',()=>{
 const storage={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
 const {checkpoint:c}=setup(storage);const first=c.startRound();assert.equal(first.number,4);
 c.persistDraft('8');c.submit('8',Check.check);assert.equal(c.current().correct,true);assert(c.warning);
 assert.equal(c.export().summary.independent,1);assert.equal(c.next().number,7);
});

test('real course pools cover all 13 numbers and exclude foundational lessons',()=>{
 const real=['geometry','stereo','algebra','probability','equations','functions','applied','readiness'].flatMap(x=>require('../ege-profil/start/'+x+'-data'));
 const {checkpoint:c,state}=setup(memory(),real);c.startRound();const taskIds=[];
 for(let i=0;i<13;i++){
  const cur=c.current();assert.equal(cur.number,Checkpoint.ORDER[i]);assert.equal(cur.lesson.position,cur.number);
  assert(cur.lesson.tasks.slice(-3).some(t=>t.id===cur.task.id));taskIds.push(cur.task.id);
  c.submit('0',Check.check);c.next();
 }
 assert.equal(new Set(taskIds).size,13);assert.equal(Object.keys(state.data.seen).length,13);
 assert.equal(c.snapshot().summary.attempted,13);
});
