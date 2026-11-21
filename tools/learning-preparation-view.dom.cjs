'use strict';

// Synthetic DTO/summary responses exercise the real cabinet poll and renderer.
// No live accounts, server mutations, timers, or student data are involved.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const catalog=require('../learning/catalog');
const map=require('../learning/preparation-map');
const clone=value=>JSON.parse(JSON.stringify(value));
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const settle=async()=>{await tick();await tick();};
const angle='[data-prep-start="path:grade7-g-angle-addition"]';
const pupil={id:'fixture-pupil',role:'student',name:'Synthetic pupil',profile:{course:'oge',goal:'pass',focus:'',version:1}};
const summary={id:'fixture-grid',learnerId:pupil.id,teacherId:'fixture-teacher',trainerId:'ege-path',contentId:'pre7-grid-area',version:1,trainerVersion:1,controller:'student',assistance:{},outcome:'started',sourceAttemptId:null,submission:null,archivedAt:null,createdAt:'2026-11-18T00:00:00Z',updatedAt:'2026-11-18T00:00:00Z'};
// /attempts omits these three fields; remember() retains the full opened DTO.
const detailed={...summary,taskSpec:{contentId:summary.contentId,seed:1},state:{step:0,answer:'unfinished synthetic answer'},strokes:[]};

function fixture(t){
 const dom=new JSDOM(read('learning/index.html'),{url:'https://cabinet.example.test/learning/#route',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 w.setInterval=()=>0;w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
 w.LearningCatalog=catalog;w.LearningPreparation=map;w.eval(read('learning/preparation.js'));
 const calls=[],storageWrites=[],releases=[];
 const nativeWrite=w.Storage.prototype.setItem;
 w.Storage.prototype.setItem=function(...args){storageWrites.push(args);return nativeWrite.apply(this,args);};
 let loadGate=null;
 const data={'/attempts':{attempts:[clone(summary)]},'/assignments':{assignments:[]},'/lessons':{lessons:[]},'/profile':{profile:clone(pupil.profile)},'/plan':{items:[],note:''},'/progress':{progress:[]},'/rewards':{level:1,totalPoints:0,pointsWithinLevel:0,nextLevelAt:100,uniqueCompleted:0,badges:[]}};
 w.fetch=async(target,options={})=>{
  const route=String(target).replace('/api/learning','');calls.push({route,method:options.method||'GET'});
  assert.equal(options.method||'GET','GET','Presentation updates cannot create or modify work');
  assert(Object.hasOwn(data,route),'Unexpected synthetic API '+route);
  const response=clone(data[route]);
  if(['/rewards','/plan','/progress'].includes(route)&&loadGate)await loadGate;
  return{ok:true,status:200,json:async()=>response};
 };
 const app=read('learning/app.js');
 const startup=app.lastIndexOf("(async()=>{const revision=authRevision;try{try{const status=await api('/status')");
 assert(startup>0);
 // Only session restoration is replaced. These hooks call the unchanged real
 // adoption, remember, render, polling, refresh and cleanup implementations.
 w.eval(app.slice(0,startup)+`window.fixtureApp={
  start(person,rows){adoptAccount(person);attempts=rows;return render();},
  remember,
  poll(){listingPollAt=0;return poll();},
  go(route){history.replaceState(null,'','#'+route);return render();},
  profile(value){account.profile=value;return render();},
  account(person){adoptAccount(person);return render();},
  clear:clearAccountView,
  attempts:()=>attempts
 };})();`);
 t.after(()=>{releases.forEach(resolve=>resolve());w.close();});
 const host=w.document.getElementById('main');
 return{w,host,app:w.fixtureApp,data,calls,storageWrites,
  async start(){await w.fixtureApp.start(clone(pupil),[clone(summary)]);},
  holdLoads(){let release;loadGate=new Promise(resolve=>{release=resolve;});releases.push(release);return()=>{loadGate=null;release();};},
  mode:()=>host.querySelector('[data-prep-mode][aria-pressed="true"]')?.dataset.prepMode,
  lab(){host.querySelector('[data-prep-mode="lab"]').click();return host.querySelector(angle).closest('details');},
  search(value){const input=host.querySelector('[data-prep-search]');input.value=value;input.dispatchEvent(new w.Event('input',{bubbles:true}));}
 };
}
function assertAngle(f){
 assert.equal(f.mode(),'lab');const button=f.host.querySelector(angle);assert(button);assert(button.closest('details').open);assert(!button.disabled);
}
function assertDefault(f){
 assert.equal(f.mode(),'tasks');
 assert.equal(f.host.querySelector('[data-prep-search]'),null);
 assert.equal(f.host.querySelector('details[open]'),null);
}

test('deferred route loading keeps the selected laboratory and open disclosure',async t=>{
 const f=fixture(t),release=f.holdLoads();await f.start();
 assert.equal(f.host.querySelector(angle),null,'The laboratory-only target is absent from core tasks');
 const old=f.lab();old.open=true;assertAngle(f);release();await settle();
 assert(!old.isConnected,'The asynchronous result really replaced the DOM');assertAngle(f);
 assert.equal(f.host.querySelector('[data-prep-disclosure="lab:numbers"]').open,false);
 assert.deepEqual(f.storageWrites,[],'View state stays in this document');
});

test('actual poll from remembered DTO to summary retains mode and disclosure without suppressing refresh',async t=>{
 const f=fixture(t);await f.start();await settle();
 f.app.remember(clone(detailed));const old=f.lab();old.open=true;const before=JSON.stringify(detailed);
 await f.app.poll();await settle();
 assert(!old.isConnected,'The same-route poll still remounts after the DTO/summary change');assertAngle(f);
 assert.deepEqual(clone(f.app.attempts()),[summary],'The real summary refresh completed');
 assert.equal(JSON.stringify(detailed),before);
 assert.equal(f.calls.filter(call=>call.route==='/progress').length,2,'The new renderer fetched fresh progress');
 assert.deepEqual(f.storageWrites,[]);
});

test('real plan and profile-version refresh is applied while the laboratory remains open',async t=>{
 const f=fixture(t);await f.start();await settle();f.lab().open=true;
 f.data['/profile'].profile.version=2;
 f.data['/plan']={items:[{catalogId:'path:grade7-g-angle-addition',reason:'New synthetic recommendation',priority:'high'}],note:'Updated synthetic plan'};
 await f.app.poll();await settle();assertAngle(f);
 f.host.querySelector('[data-prep-mode="tasks"]').click();
 assert.match(f.host.querySelector('.prep-route-note').textContent,/Updated synthetic plan/);
 assert.equal(f.host.querySelector('.prep-route-step').dataset.prepItem,'path:grade7-g-angle-addition');
 f.lab();assertAngle(f);
});

test('search and explicitly closed search results survive delayed loading and polling',async t=>{
 const f=fixture(t),release=f.holdLoads();await f.start();f.lab();f.search('угл');
 let group=f.host.querySelector(angle).closest('details');assert(group.open,'Searching still opens matching groups');group.open=false;
 release();await settle();
 assert.equal(f.host.querySelector('[data-prep-search]').value,'угл');assert.equal(f.host.querySelector(angle).closest('details').open,false);
 f.app.remember(clone(detailed));await f.app.poll();await settle();
 assert.equal(f.host.querySelector('[data-prep-search]').value,'угл');assert.equal(f.host.querySelector(angle).closest('details').open,false);
 f.search('Числа');assert([...f.host.querySelectorAll('[data-prep-lab-groups] details')].every(details=>details.open));
 f.search('');assert([...f.host.querySelectorAll('[data-prep-lab-groups] details')].every(details=>!details.open));
});

test('task and nested home disclosures survive their own refresh',async t=>{
 const f=fixture(t),release=f.holdLoads();await f.start();
 const group=f.host.querySelector('[data-prep-disclosure="tasks:numbers"]');group.open=true;release();await settle();
 assert.equal(f.host.querySelector('[data-prep-disclosure="tasks:numbers"]').open,true);
 await f.app.go('home');await settle();
 f.host.querySelector('[data-prep-disclosure="experience"]').open=true;
 f.host.querySelector('[data-prep-disclosure="rewards"]').open=true;
 f.app.remember(clone(detailed));await f.app.poll();await settle();
 assert.equal(f.host.querySelector('[data-prep-disclosure="experience"]').open,true);
 assert.equal(f.host.querySelector('[data-prep-disclosure="rewards"]').open,true);
});

for(const change of ['account','course','non-preparation-course','goal','focus','route','role','logout'])test('presentation state resets on '+change+' context change',async t=>{
 const f=fixture(t);await f.start();await settle();f.lab().open=true;f.search('угл');
 if(change==='account')await f.app.account({...clone(pupil),id:'another-synthetic-pupil'});
 if(change==='course')await f.app.profile({...clone(pupil.profile),course:'foundations',goal:null});
 if(change==='non-preparation-course'){await f.app.profile({...clone(pupil.profile),course:'school',goal:null});await f.app.profile(clone(pupil.profile));}
 if(change==='goal')await f.app.profile({...clone(pupil.profile),goal:'grade5'});
 if(change==='focus')await f.app.profile({...clone(pupil.profile),focus:'Another course context'});
 if(change==='route'){await f.app.go('home');await f.app.go('route');}
 if(change==='role'){await f.app.account({...clone(pupil),role:'teacher'});await f.app.account(clone(pupil));}
 if(change==='logout'){f.app.clear();await f.app.account(clone(pupil));}
 await settle();assertDefault(f);
});

test('an old account load cannot restore its mode, search, or content after account replacement',async t=>{
 const f=fixture(t),releaseOld=f.holdLoads();await f.start();f.lab().open=true;f.search('угл');
 f.data['/plan']={items:[],note:'New account plan'};
 const releaseNew=f.holdLoads();await f.app.account({...clone(pupil),id:'new-synthetic-pupil'});assertDefault(f);
 releaseOld();await settle();assertDefault(f);assert.doesNotMatch(f.host.textContent,/New account plan/,'The current request is still pending');
 releaseNew();await settle();assertDefault(f);assert.match(f.host.textContent,/New account plan/);
});
