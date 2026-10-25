'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..');
const names={20:'equations',21:'word-problems',22:'functions-graphs'};
class Local extends ResourceLoader{fetch(url){if(new URL(url).pathname==='/trainers/board-bridge.js')return Promise.resolve(Buffer.from('window.MathExamBoard={register(c){window.__registration=c;window.__notifications=0;c.subscribe(()=>window.__notifications++);}};'));const p=path.join(root,new URL(url).pathname);return p.startsWith(root+path.sep)&&fs.existsSync(p)?Promise.resolve(fs.readFileSync(p)):null;}}
const settle=()=>new Promise(r=>setTimeout(r,35));
async function boot(n,board=true,captured=null){
 const errors=[],writes=[],reads=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/Not implemented/.test(e.message))errors.push(e.message);});
 const dom=new JSDOM(fs.readFileSync(path.join(root,`trainers/oge-task${n}-${names[n]}.html`),'utf8'),{url:`https://mathexam.test/trainers/oge-task${n}-${names[n]}.html${board?'?board=1':''}`,runScripts:'dangerously',resources:new Local(),pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){if(captured){const add=w.EventTarget.prototype.addEventListener;w.EventTarget.prototype.addEventListener=function(type,callback,options){captured.push({target:this,type,callback,capture:options===true||!!options?.capture});return add.call(this,type,callback,options);};}w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.__TESTHOOK__=true;const get=w.Storage.prototype.getItem,set=w.Storage.prototype.setItem;w.Storage.prototype.getItem=function(k){reads.push(k);return get.call(this,k)};w.Storage.prototype.setItem=function(k,v){writes.push(k);return set.call(this,k,v)};}});
 await new Promise(r=>dom.window.addEventListener('load',r,{once:true}));await settle();
 return {dom,w:dom.window,d:dom.window.document,errors,reads,writes,stage:()=>dom.window.document.querySelector('.oge-native-shared-stage'),close:()=>dom.window.close()};
}
function clone(w,value){return w.JSON.parse(JSON.stringify(value));}
const state=t=>JSON.parse(JSON.stringify(t.w.getBoardTrainerState()));
const click=(t,label)=>{const b=[...t.stage().querySelectorAll('button')].find(x=>x.textContent.trim()===label);assert(b,'button '+label);b.click();};
async function sync(a,b){const value=state(a),sent=b.w.__notifications;assert(b.w.Oge2022Board.validateState(clone(b.w,value)));b.w.applyBoardTrainerState(clone(b.w,value));await settle();assert.deepEqual(state(b),value);assert.equal(a.stage().textContent,b.stage().textContent,'native feedback and models must match');assert.equal(b.w.__notifications,sent,'remote apply must not echo');assert(Buffer.byteLength(JSON.stringify(value),'utf8')<65536);const depth=x=>x&&typeof x==='object'?1+Math.max(0,...Object.values(x).map(depth)):1;assert(depth(value)<=8);}
for(const n of [20,21,22])test(`${n}: all native modules restore in independent peers, no personal storage`,async()=>{
 const a=await boot(n),b=await boot(n);try{
  assert.deepEqual(a.errors,[]);assert.deepEqual(b.errors,[]);assert(a.w.Oge2022Board);
  let count=0;
  for(const row of a.w.Oge2022Native.modules){
   // Fresh module state is obtained through the public native picker; this also
   // checks that every advertised module can actually be selected.
   const picker=a.d.getElementById('oge-shared-module');picker.value=row.key;picker.dispatchEvent(new a.w.Event('change',{bubbles:true}));await settle();
   assert.equal(state(a).module,row.key);await sync(a,b);assert.equal(a.stage().textContent,b.stage().textContent);count++;
  }
  assert(count>={20:13,21:11,22:12}[n]);assert.deepEqual(a.reads,[]);assert.deepEqual(a.writes,[]);assert.deepEqual(b.reads,[]);assert.deepEqual(b.writes,[]);assert.deepEqual(a.errors,[]);assert.deepEqual(b.errors,[]);
 }finally{a.close();b.close();}
});
for(const n of [20,21,22])test(`${n}: drafts, wrong answers, native help, models and notebook survive peer reload`,async()=>{
 const a=await boot(n),b=await boot(n);let c;try{
  if(n===22)click(a,'+ отдельное значение');
  const nativeFields=[...a.stage().querySelectorAll('input')].filter(x=>!x.closest('.oca-work,.oca-exploration,.oca-reference')&&!['range','radio','checkbox'].includes(x.type)&&!x.disabled);
  nativeFields[0].value='987654';nativeFields[0].dispatchEvent(new a.w.Event('input',{bubbles:true}));await sync(a,b);
  const checker=[...a.stage().querySelectorAll('button')].find(x=>x.textContent.trim()==='Проверить'&&!x.disabled&&!x.closest('[hidden]'));assert(checker);checker.click();await settle();await sync(a,b);
  click(a,'Хочешь подсказку?');await settle();assert.equal(a.stage().querySelector('.minimal-help').hidden,false);await sync(a,b);assert.equal(b.stage().querySelector('.minimal-help').hidden,false);
  const note=a.stage().querySelector('.oca-work textarea');assert(note);note.value='Пусть x > 0 — неизвестная величина.\nПроверяю x < 100 и исходное условие.';note.dispatchEvent(new a.w.Event('input',{bubbles:true}));
  const check=a.stage().querySelector('.oca-work input[type=checkbox]');check.checked=true;check.dispatchEvent(new a.w.Event('change',{bubbles:true}));
  const range=a.stage().querySelector('.minimal-help input[type=range]');if(range){range.value=range.max;range.dispatchEvent(new a.w.Event('input',{bubbles:true}));}
  const stepsButton=[...a.stage().querySelectorAll('button')].find(x=>x.textContent==='Разобрать по шагам');if(stepsButton){stepsButton.click();await settle();}
  const descriptor=state(a).seed;
  const reveal=[...a.stage().querySelectorAll('button')].find(x=>/^(Показать шаг|Далее →|Понятно, дальше →)$/.test(x.textContent.trim())&&!x.disabled&&!x.closest('[hidden]'));if(reveal){reveal.click();await settle();assert.equal(state(a).seed,descriptor,'advancing a help step keeps the task');}
  await sync(a,b);c=await boot(n);await sync(a,c);
  assert.equal(c.stage().querySelector('.oca-work textarea').value,note.value);
  assert.deepEqual(a.writes,[]);assert.deepEqual(b.writes,[]);assert.deepEqual(c.writes,[]);assert.deepEqual(a.errors,[]);assert.deepEqual(b.errors,[]);assert.deepEqual(c.errors,[]);
 }finally{a.close();b.close();c?.close();}
});
for(const n of [20,21,22])test(`${n}: malformed or impossible histories are rejected before live mutation`,async()=>{
 const t=await boot(n);try{const good=state(t),before=t.stage(),text=before.textContent;
  const bads=[{...good,extra:true},{...good,module:'__proto__'},{...good,seed:-1},{...good,actions:[['activate','check:9999',[]]]},{...good,drafts:[['text:9999','hello']]},{...good,drafts:[['text:0','<img src=x>']]},{...good,shared:{...good.shared,task:999}}];
  for(const v of bads){assert.equal(t.w.Oge2022Board.validateState(clone(t.w,v)),false);assert.throws(()=>t.w.applyBoardTrainerState(clone(t.w,v)));assert.equal(t.stage(),before);assert.equal(t.stage().textContent,text);assert.deepEqual(state(t),good);}
  assert.deepEqual(t.errors,[]);
 }finally{t.close();}
});
test('20 and 22: accepted standalone answer fields are locked',async()=>{
 for(const n of [20,22]){const t=await boot(n,false);try{
  if(n===20){const api=t.w.__T20,engine={gen:()=>({}),render:()=>({head:'Ответ',problemHTML:'2+3',mount:host=>api._test.fracField(host,{noToggle:true}),check:read=>({ok:String(read())==='5'}),stepper:()=>({steps:[]})})};
   const host=t.d.createElement('div');t.d.body.append(host);api._test.mountMarathon(host,engine);const field=host.querySelector('input');field.value='5';host.querySelector('button.primary').click();assert.equal(field.disabled,true);
  }else{
   t.d.querySelector('.mod-btn[data-mod="m3"]').click();
   const card=t.d.querySelector('.panel:not(.hidden) .mode-host[data-mode="marathon"]'),p=card.__problem,block=card.querySelector('.ans-host');
   assert(p.vals.length);for(let i=1;i<p.vals.length;i++)block.querySelector('.ab-add').click();
   [...block.querySelectorAll('.vinput')].forEach((row,i)=>{row.querySelector('.v-tog').click();row.querySelector('.v-num').value=String(p.vals[i].n);row.querySelector('.v-den').value=String(p.vals[i].d);});
   [...card.querySelectorAll(':scope > .btn-row > .btn-check')][0].click();
   assert.match(card.querySelector(':scope > .fb').textContent,/Верно/);
   for(const node of block.querySelectorAll('input,select,button'))assert.equal(node.disabled,true);
  }
 }finally{t.close();}}
});

for(const n of [20,21,22])test(`${n}: accepted answers survive handoff and reject edits or repeated checking`,async()=>{
 const a=await boot(n),b=await boot(n);try{
  if(n===20){const old=a.w.__T20.R.A;a.w.__T20.R.A=d=>{a.w.__answer=d.ans;return old(d);};}
  if(n===21){const m=a.w.__T.MODULES[0],old=m.gen;m.gen=function(){const p=old.call(this);a.w.__answer=m.finalParts(p)[0].ans.toNumber();return p;};}
  const picker=a.d.getElementById('oge-shared-module');picker.value=n===22?'m3':a.w.Oge2022Native.modules[0].key;picker.dispatchEvent(new a.w.Event('change',{bubbles:true}));
  if(n===22){const p=a.stage().__problem,block=a.stage().querySelector('.ans-host');for(let i=1;i<p.vals.length;i++)block.querySelector('.ab-add').click();[...block.querySelectorAll('.vinput')].forEach((row,i)=>{row.querySelector('.v-tog').click();for(const [selector,value]of [['.v-num',p.vals[i].n],['.v-den',p.vals[i].d]]){const x=row.querySelector(selector);x.value=String(value);x.dispatchEvent(new a.w.Event('input',{bubbles:true}));}});}
  else {const x=[...a.stage().querySelectorAll('input')].find(x=>!x.closest('.oca-work,.oca-exploration,.oca-reference'));x.value=String(a.w.__answer);x.dispatchEvent(new a.w.Event('input',{bubbles:true}));}
  const checker=[...a.stage().querySelectorAll('button')].find(x=>x.textContent.trim()==='Проверить'&&!x.closest('[hidden]'));checker.click();await settle();assert.equal(checker.disabled,true);await sync(a,b);
  const good=state(b),last=good.actions.at(-1);assert.equal(last[0],'activate');for(const mutate of [s=>s.actions.push(last),s=>s.drafts=last[2].map(([k,v])=>[k,typeof v==='string'?v+'1':!v])]){const bad=clone(b.w,good);mutate(bad);assert.equal(b.w.Oge2022Board.validateState(bad),false);assert.throws(()=>b.w.applyBoardTrainerState(bad));assert.deepEqual(state(b),good);}
  assert.deepEqual(a.errors,[]);assert.deepEqual(b.errors,[]);
 }finally{a.close();b.close();}
});
test('20: invalid assistance flag cannot poison the shared notebook cache',async()=>{const t=await boot(20);try{click(t,'Хочешь подсказку?');const note=t.stage().querySelector('.oca-work textarea');note.value='ORIGINAL';note.dispatchEvent(new t.w.Event('input',{bubbles:true}));const good=state(t),bad=clone(t.w,good);bad.helpUsed=false;bad.shared.cards[0].work.text='POISON';assert.equal(t.w.Oge2022Board.validateState(bad),false);assert.throws(()=>t.w.applyBoardTrainerState(bad));const stage=t.d.createElement('section');const native=t.w.Oge2022Native;const original=t.w.Math.random;let seed=good.seed;t.w.Math.random=()=>{seed+=0x6D2B79F5;let x=seed;x=Math.imul(x^(x>>>15),x|1);x^=x+Math.imul(x^(x>>>7),x|61);return ((x^(x>>>14))>>>0)/4294967296;};try{native.mount(stage,good.module);}finally{t.w.Math.random=original;}t.w.OgeCourseAlgebraShared.enhanceCard(native.card(stage));assert.equal(stage.querySelector('.oca-work textarea').value,'ORIGINAL');assert.deepEqual(state(t),good);}finally{t.close();}});

test('22: large local answer histories roll back before exceeding the transport budget',async()=>{const a=await boot(22),b=await boot(22);try{const picker=a.d.getElementById('oge-shared-module');picker.value='m3';picker.dispatchEvent(new a.w.Event('change',{bubbles:true}));for(let i=0;i<9;i++)a.stage().querySelector('.ans-host .ab-add').click();const area=a.stage().querySelector('.oca-work textarea');area.value='ж'.repeat(6000);area.dispatchEvent(new a.w.Event('input',{bubbles:true}));await settle();let rolledBack=false;for(let i=0;i<25;i++){const block=a.stage().querySelector('.ans-host');for(const x of block.querySelectorAll('input')){x.value=String(i%10).repeat(120);x.dispatchEvent(new a.w.Event('input',{bubbles:true}));}block.querySelector('.v-tog').click();await settle();const warning=a.d.querySelector('#app > p[role=status]');assert(Buffer.byteLength(JSON.stringify(state(a)),'utf8')<60001);if(!warning.hidden){rolledBack=true;break;}}assert(rolledBack,'oversized local trace was visibly rejected');await sync(a,b);assert.deepEqual(a.errors,[]);}finally{a.close();b.close();}});

// Native browser dispatch can checkpoint microtasks between capture and the
// target listener. A single scripted dispatchEvent() in jsdom cannot expose it.
async function nativeCapture(t,list,type,target){
 const listener=list.findLast(x=>x.target===t.stage()&&x.type===type&&x.capture);assert(listener,'native stage capture '+type);
 listener.callback.call(t.stage(),{target,key:'',preventDefault(){},stopImmediatePropagation(){}});
 await Promise.resolve();await Promise.resolve();
}
function nativeTarget(t,list,type,target){
 for(const entry of list.filter(x=>x.target===target&&x.type===type&&!x.capture))entry.callback.call(target,new t.w.Event(type));
}
for(const n of [20,21,22])test(`${n}: native event checkpoints publish completed notes and checks once, without lag or remote echo`,async()=>{
 const listeners=[],a=await boot(n,true,listeners),b=await boot(n);try{
  // Use the real generated problem and grader; no expected answer enters state.
  if(n===20){const old=a.w.__T20.R.A;a.w.__T20.R.A=d=>{a.w.__answer=d.ans;return old(d);};}
  if(n===21){const m=a.w.__T.MODULES[0],old=m.gen;m.gen=function(){const p=old.call(this);a.w.__answer=m.finalParts(p)[0].ans.toNumber();return p;};}
  const picker=a.d.getElementById('oge-shared-module');picker.value=n===22?'m3':a.w.Oge2022Native.modules[0].key;picker.dispatchEvent(new a.w.Event('change',{bubbles:true}));
  if(n===22){const p=a.stage().__problem,block=a.stage().querySelector('.ans-host');for(let i=1;i<p.vals.length;i++)block.querySelector('.ab-add').click();[...block.querySelectorAll('.vinput')].forEach((row,i)=>{row.querySelector('.v-tog').click();row.querySelector('.v-num').value=String(p.vals[i].n);row.querySelector('.v-den').value=String(p.vals[i].d);});}
  else [...a.stage().querySelectorAll('input')].find(x=>!x.closest('.oca-work,.oca-exploration,.oca-reference')).value=String(a.w.__answer);
  await settle();const published=[];a.w.__registration.subscribe(()=>published.push(state(a)));
  const note=a.stage().querySelector('.oca-work textarea');note.value='x < 5\nПроверка';
  await nativeCapture(a,listeners,'input',note);
  assert.equal(published.length,0,'Capture must not publish raw notes before the native input handler');
  nativeTarget(a,listeners,'input',note);assert.equal(note.value,'x ＜ 5\nПроверка');
  await settle();assert.equal(published.length,1,'The first input publishes without another event');assert.equal(published[0].shared.cards[0].work.text,note.value);
  const checker=[...a.stage().querySelectorAll('button')].find(x=>x.textContent.trim()==='Проверить'&&!x.closest('[hidden]'));
  await nativeCapture(a,listeners,'click',checker);assert.equal(checker.disabled,true,'The real native grader accepted this answer');assert.equal(published.length,1,'The capture checkpoint does not publish an intermediate check');
  await settle();assert.equal(published.length,2,'One check publishes its own completed result');assert.deepEqual(published[1],state(a));await sync(a,b);
  const checked=a.stage().querySelector('.oca-work input[type=checkbox]');
  note.value='Первый черновик';await nativeCapture(a,listeners,'input',note);nativeTarget(a,listeners,'input',note);
  note.value='Окончательная запись';await nativeCapture(a,listeners,'input',note);nativeTarget(a,listeners,'input',note);
  checked.checked=true;await nativeCapture(a,listeners,'change',checked);nativeTarget(a,listeners,'change',checked);
  assert.equal(published.length,2,'Nested input and change events remain coalesced until dispatch completes');
  await settle();assert.equal(published.length,3);assert.equal(published[2].shared.cards[0].work.text,'Окончательная запись');assert.equal(published[2].shared.cards[0].work.checks[0],true);
  // A remote snapshot arriving while a local notification is queued establishes
  // the new baseline, so the queued task cannot echo the applied state.
  note.value='Локальный незавершённый ввод';await nativeCapture(a,listeners,'input',note);
  a.w.applyBoardTrainerState(clone(a.w,state(b)));await settle();assert.equal(published.length,3);assert.deepEqual(state(a),state(b));
  assert.deepEqual(a.errors,[]);assert.deepEqual(b.errors,[]);
 }finally{a.close();b.close();}
});
