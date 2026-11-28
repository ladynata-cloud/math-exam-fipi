'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM,VirtualConsole}=require('jsdom');
const {isDeepStrictEqual}=require('node:util');
const ROOT=path.resolve(__dirname,'../..'),SOURCE=fs.readFileSync(ROOT+'/geometry-course/assets/store.js','utf8');
const KEY='mathExamGeometry.v1',HK='mathExamGeometryCheckpoint.v1',URL='file:///offline/geometry-course/atlas/segments.html';
const schema=require(ROOT+'/geometry-course/assets/store.js'),copy=x=>JSON.parse(JSON.stringify(x));
const record=changes=>copy(schema.clean({...schema.fresh(),...changes}));
const picture=n=>({points:[{id:'A',kind:'free',x:n,y:1},{id:'B',kind:'free',x:8,y:5}],objects:[{id:'L1',type:'line',a:'A',b:'B',extent:'segment'}]});
const investigation=text=>({version:1,topic:'segments',opened:true,prediction:'unsure',values:{a:5},firstValues:{a:3},changed:true,observation:text});
const meaningful=x=>{const out=copy(x);delete out.updated;delete out.events;return out;};
const archived=(value,fields)=>value.recoveries.some(r=>Object.entries(fields).every(([k,v])=>isDeepStrictEqual(r[k],v)));
function backend(units={}){const data=new Map();if(Object.keys(units).length)data.set(KEY,JSON.stringify({version:1,units}));return {data,replace(units){data.set(KEY,JSON.stringify({version:1,units}));},saved(){return JSON.parse(data.get(KEY)||'{"units":{}}').units.segments;}};}
function entry(value={foreign:{route:'kept',step:3}}){return {value:structuredClone(value),length:4};}
function document(shared=backend(),historyEntry=entry(),options={}){
 const faults={read:false,write:false,historyRead:false,historyWrite:false,historyNoop:false,...options.faults},calls={reads:0,writes:0,historyReads:0,historyWrites:0,replaceArguments:[]},warnings=[];
 const context={module:{exports:{}},Date:{now:()=>1000},structuredClone,location:new global.URL(options.url||URL),localStorage:{
  getItem(k){calls.reads++;if(faults.read)throw Error('Read unavailable');return shared.data.get(k)||null;},
  setItem(k,v){calls.writes++;if(faults.write&&k===KEY)throw Error('Quota exceeded');shared.data.set(k,String(v));}
 },history:{get state(){calls.historyReads++;if(faults.historyRead)throw Error('History read unavailable');return historyEntry.value;},get length(){return historyEntry.length;},replaceState(value,...args){calls.historyWrites++;calls.replaceArguments.push(args);if(faults.historyWrite)throw Error('SecurityError');if(!faults.historyNoop)historyEntry.value=structuredClone(value);}}};
 vm.runInNewContext(SOURCE,context);const api=context.module.exports,s=api.open(['segments','pythagoras'],m=>warnings.push(m),Object.hasOwn(options,'unit')?options.unit:'segments');
 return {api,s,shared,historyEntry,context,faults,calls,warnings,get:()=>copy(s.get('segments')),put:(v,event)=>copy(s.put('segments',v,event)),checkpoint:v=>s.checkpoint('segments',v),envelope:()=>historyEntry.value[HK]};
}

test('synchronous file checkpoint restores the complete current record before a debounced storage write',()=>{
 const shared=backend(),a=document(shared),state=record({stage:5,seed:12,draft:'14/4',written:'Последний текст доказательства',observation:'Прежняя запись',drawing:picture(3),research:investigation('Последнее наблюдение'),assisted:true,hints:2,attempts:4,independent:2,checked:false,currentTaskKey:'same-task',proofId:'line-uniqueness',proofDone:['s1'],retainedProof:{id:'old-proof',done:['s1'],written:'Прежнее доказательство'},recoveries:[{at:10,reason:'Предыдущий вариант',written:'Сохранённая работа',drawing:picture(1)}]});
 a.checkpoint(state);assert.equal(a.calls.writes,0);assert.equal(shared.saved(),undefined);
 const b=document(shared,a.historyEntry);for(const read of [()=>b.get(),()=>copy(b.s.all().units.segments),()=>copy(b.s.export().units.segments)])assert.deepEqual(meaningful(read()),meaningful(state));
 b.put(b.get(),'start');assert.deepEqual(meaningful(shared.saved()),meaningful(state));assert.equal(b.warnings.length,0);
});

test('a known original storage snapshot restores the unsaved input without treating it as another tab',()=>{
 const base=record({updated:8,written:'Начало',draft:'1',independent:2,attempts:3}),shared=backend({segments:base}),a=document(shared),state=a.get();
 state.written='Текст после ввода';state.drawing=picture(7);state.research=investigation('Наблюдение после ввода');a.checkpoint(state);
 const b=document(shared,a.historyEntry);assert.deepEqual(meaningful(b.get()),meaningful(state));assert.equal(b.get().recoveries.length,0);assert.equal(b.get().independent,2);assert.equal(b.warnings.length,0);
});

test('the per-document ancestor is immutable across multiple saves and a later unsaved input',()=>{
 const base=record({updated:9,written:'Основа',drawing:picture(1)}),shared=backend({segments:base}),a=document(shared);let state=a.get();
 state.written='Первый';state=a.put(state,'input');const ancestor=copy(a.envelope().base);
 state.written='Второй';state=a.put(state,'input');state.written='Третий';state.drawing=picture(3);a.checkpoint(state);
 assert.deepEqual(a.envelope().base,ancestor);assert.deepEqual(meaningful(ancestor),meaningful(base));assert.equal(a.envelope().local.written,'Третий');
});

test('unchanged startup and pagehide in new documents keep the older ancestor for a second rollback reload',()=>{
 const base=record({updated:6,written:'Первоначальная основа',drawing:picture(1)}),shared=backend({segments:base}),a=document(shared);let state=a.get();state.written='Последняя работа';state.drawing=picture(9);state=a.put(state,'input');
 const checkpoint=copy(a.envelope());shared.data.delete(KEY);
 for(let n=0;n<3;n++){const next=document(shared,a.historyEntry);let current=next.get();current=next.put(current,'start');next.put(current,'pagehide');next.checkpoint(current);assert.equal(next.calls.historyWrites,0);assert.deepEqual(next.envelope(),checkpoint);}
 shared.replace({segments:base});const b=document(shared,a.historyEntry);assert.equal(b.get().written,state.written);assert.deepEqual(b.get().drawing,picture(9));assert.equal(b.get().recoveries.length,0);
});

test('two successive immediate reloads preserve both new inputs when storage exposes each preceding baseline',()=>{
 const base=record({updated:5,written:'До ввода'}),shared=backend({segments:base}),a=document(shared);let state=a.get();state.written='Первый ввод';a.checkpoint(state);
 const b=document(shared,a.historyEntry);assert.equal(b.get().written,'Первый ввод');const accepted=b.put(b.get(),'start');
 state=b.get();state.written='Второй ввод';state.drawing=picture(11);b.checkpoint(state);shared.replace({segments:accepted});
 const c=document(shared,a.historyEntry);assert.equal(c.get().written,'Второй ввод');assert.deepEqual(c.get().drawing,picture(11));assert.equal(c.get().recoveries.length,0);
});

test('an unknown intermediate own snapshot retains the final text and drawing as a recovery without inventing credit',()=>{
 const base=record({updated:4,written:'Основа',drawing:picture(1),independent:2,attempts:2}),shared=backend({segments:base}),a=document(shared);let state=a.get();
 state.written='Промежуточный собственный текст';state.drawing=picture(2);state=a.put(state,'input');const intermediate=copy(state);
 state.written='Более поздний принятый текст';state.drawing=picture(4);state=a.put(state,'input');
 state.written='Окончательный текст';state.drawing=picture(3);state.research=investigation('Окончательное наблюдение');state=a.put(state,'input');
 shared.replace({segments:intermediate});const b=document(shared,a.historyEntry),restored=b.get();
 assert.equal(restored.written,intermediate.written);assert.deepEqual(restored.drawing,picture(2));assert.equal(restored.independent,2);assert.equal(restored.attempts,2);assert(archived(restored,{written:state.written,drawing:state.drawing,research:state.research}));assert(b.warnings.some(x=>x.includes('другая запись')));
});

test('unknown divergent snapshots preserve local work even when checkpoint base and local are equal',()=>{
 for(const updated of [2,50,90]){const local=record({updated:50,written:'Последний видимый текст',drawing:picture(5),research:investigation('Моё наблюдение'),independent:3,attempts:3}),remote=record({updated,written:'Иная запись',drawing:picture(2),assisted:true,hints:2,independent:2,attempts:2});
  const h=entry({foreign:'kept',[HK]:{version:1,url:URL,unit:'segments',base:local,local}}),a=document(backend({segments:remote}),h),out=a.get();
  assert.equal(out.written,remote.written);assert.equal(out.assisted,true);assert.equal(out.independent,2);assert(archived(out,{written:local.written,drawing:local.drawing,research:local.research}));
 }
});

test('another tab assistance or a new task wins over stale independent success regardless of timestamp',()=>{
 for(const updated of [1,1000,9000])for(const remoteSeed of [1,2]){const base=record({updated:5,currentTaskKey:'same',independent:2,attempts:2}),shared=backend({segments:base}),a=document(shared),state=a.get();
  Object.assign(state,{written:'Мой ответ',draft:'5',checked:true,independent:3,attempts:3,drawing:picture(8)});a.checkpoint(state);
  const remote=record({...base,updated,seed:remoteSeed,currentTaskKey:remoteSeed===1?'same':'next',assisted:true,hints:1});shared.replace({segments:remote});const out=document(shared,a.historyEntry).get();
  assert.equal(out.seed,remoteSeed);assert.equal(out.assisted,true);assert.equal(out.checked,false);assert.equal(out.independent,2);assert.equal(out.attempts,2);assert.equal(out.hints,1);assert(archived(out,{draft:'5',written:state.written,drawing:picture(8)}));
 }
});

test('an explicit successful answer keeps its pre-write accepted predecessor for a rollback reload',()=>{
 const shared=backend(),a=document(shared);let state=a.get();Object.assign(state,{stage:4,currentTaskKey:'current-independent-task'});state=a.put(state,'stage');const before=copy(state);
 Object.assign(state,{draft:'5',checked:true,independent:1,attempts:1});state=a.put(state,'independent_success');assert.deepEqual(a.envelope().accepted,before);
 shared.replace({segments:before});const b=document(shared,a.historyEntry),out=b.get();assert.equal(out.draft,'5');assert.equal(out.checked,true);assert.equal(out.independent,1);assert.equal(out.attempts,1);assert.equal(out.recoveries.length,0);
});

test('accepted predecessor requires an exact full record and read-only calls never promote it',()=>{
 const shared=backend(),a=document(shared);let state=a.get();Object.assign(state,{stage:4,currentTaskKey:'current-independent-task'});state=a.put(state,'stage');const accepted=copy(state);
 state.draft='5';state.checked=true;state.independent=1;state.attempts=1;a.checkpoint(state);
 for(const changed of [{updated:accepted.updated+1},{events:[...accepted.events,{type:'external',time:accepted.updated}]},{assisted:true,hints:1}]){
  const remote=record({...accepted,...changed});shared.replace({segments:remote});const b=document(shared,a.historyEntry),out=b.get();assert.equal(out.draft,'');assert.equal(out.checked,false);assert.equal(out.independent,0);assert(archived(out,{draft:'5'}));
 }
 const untouched=document(backend(),entry());let original=untouched.get();original.written='Своя запись';original=untouched.put(original);const foreign=record({...original,updated:original.updated+1,written:'Иная запись'});untouched.shared.replace({segments:foreign});untouched.s.all();untouched.s.export();original.written='Следующий ввод';untouched.checkpoint(original);assert.equal(untouched.envelope().accepted.written,'Своя запись');
});

test('a failed persistence does not promote the accepted predecessor',()=>{
 const shared=backend(),a=document(shared);let state=a.get();state.written='Успешная запись';state=a.put(state);const accepted=copy(state);a.faults.write=true;state.written='Не записано из-за квоты';state=a.put(state);state.draft='Новый ввод';a.checkpoint(state);assert.deepEqual(a.envelope().accepted,accepted);
});

test('hydration keeps the actual disk ancestor during quota failure and preserves a concurrent write in export',()=>{
 const shared=backend(),a=document(shared),state=a.get();state.written='Работа из checkpoint';state.drawing=picture(4);a.checkpoint(state);
 const b=document(shared,a.historyEntry,{faults:{write:true}});b.put(b.get(),'start');assert.equal(b.s.export().units.segments.written,state.written);
 const foreign=document(shared,entry(),{url:'https://example.test/segments.html'}),remote=foreign.get();remote.written='Новая работа другой вкладки';remote.observation='Отдельное наблюдение';foreign.put(remote);
 const exported=copy(b.s.export().units.segments);assert.equal(exported.written,remote.written);assert.equal(exported.observation,remote.observation);assert(archived(exported,{written:state.written,drawing:picture(4)}));assert.equal(shared.saved().written,remote.written);
 b.faults.write=false;b.put(b.get());assert.equal(shared.saved().written,remote.written);assert(archived(shared.saved(),{written:state.written,drawing:picture(4)}));
});

test('temporary storage read failure does not discard the hydrated checkpoint',()=>{
 const shared=backend(),a=document(shared),state=a.get();state.written='Работа при запрете чтения';a.checkpoint(state);
 const b=document(shared,a.historyEntry,{faults:{read:true}});assert.equal(b.get().written,state.written);assert.equal(b.s.export().units.segments.written,state.written);b.faults.read=false;assert.equal(b.get().written,state.written);b.put(b.get());assert.equal(shared.saved().written,state.written);
});

test('checkpoint hydration is restricted to the same current topic and URL, version and bounded valid record',()=>{
 const a=document(),state=a.get();state.written='Только для этой темы';state.research=investigation('Только здесь');a.checkpoint(state);const original=structuredClone(a.historyEntry.value);
 const cases=[{options:{url:URL+'?other=1'}},{options:{url:'file:///elsewhere/segments.html'}},{options:{unit:'pythagoras'}},{change:e=>e.version=2},{change:e=>e.unit='pythagoras'},{change:e=>e.url=URL+'?other=1'},{change:e=>e.local.research.topic='pythagoras'},{change:e=>e.base.research=investigation('wrong')},{change:e=>e.local=[]},{change:e=>e.excess='x'.repeat(512001)}];
 cases[7].change=e=>{e.base.research=investigation('wrong');e.base.research.topic='pythagoras';};
 for(const c of cases){const h=entry(original);if(c.change)c.change(h.value[HK]);const b=document(backend(),h,c.options||{});assert.equal(b.s.export().units.segments,undefined);assert.equal(b.s.export().units.pythagoras,undefined);}
 const same=document(backend(),entry(original),{url:URL+'#research'});assert.equal(same.get().written,state.written);
});

test('stored work is sanitized and an oversized checkpoint leaves the last valid history entry intact',()=>{
 const a=document(),state=a.get();state.written='Обычная работа';a.checkpoint(state);const initial=structuredClone(a.historyEntry.value);
 state.seenTasks=Array.from({length:600},(_,i)=>String(i)+'x'.repeat(990));a.checkpoint(state);assert.deepEqual(a.historyEntry.value,initial);assert(a.warnings.some(s=>s.includes('резервную запись')));
 const b=document(),invalid={...record(),written:'w'.repeat(25000),draft:'d'.repeat(800),drawing:{points:[{id:'A',kind:'free',x:Infinity,y:0}],objects:[]},research:investigation('o'.repeat(6000)),unknown:'ignored'};b.checkpoint(invalid);
 const c=document(backend(),b.historyEntry),out=c.get();assert.equal(out.written.length,20000);assert.equal(out.draft.length,300);assert.equal(out.research.observation.length,5000);assert.equal(out.drawing,null);assert.equal(out.unknown,undefined);
});

test('foreign history fields and root cycles survive without changing URL or stack',()=>{
 const foreign={route:'other-app',nested:{values:[1,2]},date:new Date(123),large:123n};foreign.self=foreign;foreign.nested.parent=foreign;const h=entry(foreign),original=h.value,a=document(backend(),h,{url:URL+'#section'}),state=a.get();state.written='Текущий текст';a.checkpoint(state);
 assert.equal(original[HK],undefined);assert.notEqual(h.value,original);assert.equal(h.value.self,h.value);assert.equal(h.value.nested.parent,h.value);assert.deepEqual(h.value.nested.values,[1,2]);assert.equal(h.value.date.getTime(),123);assert.equal(h.value.large,123n);assert.equal(h.value.route,'other-app');assert.equal(a.context.location.href,URL+'#section');assert.equal(a.context.history.length,4);assert.deepEqual(a.calls.replaceArguments,[['']]);
});

test('throwing or silently ignored history writes warn, retain export and do not suppress a later valid retry',()=>{
 for(const fault of ['historyWrite','historyNoop']){const h=entry(),original=h.value,a=document(backend(),h,{faults:{[fault]:true,write:true}}),state=a.get();state.written='Работа для скачивания';state.drawing=picture(6);
  a.checkpoint(state);a.put(state,'input');assert.equal(a.s.export().units.segments.written,state.written);assert.deepEqual(copy(a.s.export().units.segments.drawing),picture(6));assert.equal(h.value,original);assert.equal(h.value[HK],undefined);assert.equal(a.warnings.filter(w=>w.includes('резервную запись')).length,1);
  const attempts=a.calls.historyWrites;a.faults[fault]=false;a.checkpoint(state);assert.equal(a.calls.historyWrites,attempts+1);assert.equal(a.envelope().local.written,state.written);a.checkpoint(state);assert.equal(a.calls.historyWrites,attempts+1);
 }
});

test('unavailable history reads and unsupported foreign roots leave regular saving and export usable',()=>{
 for(const options of [{faults:{historyRead:true}},{root:['foreign','array']}]){const h=entry(options.root||{foreign:true}),a=document(backend(),h,options),state=a.get();state.written='Сохраняем обычный файл';a.put(state);assert.equal(a.shared.saved().written,state.written);assert.equal(a.s.export().units.segments.written,state.written);assert(a.warnings.some(w=>w.includes('резервную запись')));if(options.root)assert.deepEqual(h.value,options.root);}
});

test('HTTP and stores without a current unit never access history and retain identical storage behavior',()=>{
 function run(options){const a=document(backend(),entry(),{...options,faults:{historyRead:true,historyWrite:true}}),state=a.get();state.written='HTTP текст';a.checkpoint(state);a.put(state,'input');a.s.export();a.s.import({version:1,units:{segments:record({...state,updated:9000,written:'Импорт'})}});assert.equal(a.calls.historyReads,0);assert.equal(a.calls.historyWrites,0);assert.equal(a.warnings.length,0);return {record:copy(a.s.export()),bytes:[...a.shared.data],reads:a.calls.reads,writes:a.calls.writes};}
 const without=run({unit:undefined}),http=run({url:'https://example.test/geometry-course/atlas/segments.html'});assert.deepEqual(http,without);run({unit:'unknown'});
});

test('only the opted-in topic changes its checkpoint; an explicit current-topic import is captured',()=>{
 const a=document(),state=a.get();state.written='Текущая тема';a.put(state);const before=copy(a.envelope());a.s.put('pythagoras',record({written:'Другая тема'}));a.s.checkpoint('pythagoras',record({written:'Другой ввод'}));assert.deepEqual(a.envelope(),before);
 a.s.import({version:1,units:{segments:record({updated:9000,written:'Новый импорт',drawing:picture(5)})}});assert.equal(a.envelope().local.written,'Новый импорт');a.shared.data.delete(KEY);const b=document(a.shared,a.historyEntry);assert.equal(b.get().written,'Новый импорт');assert.equal(b.s.export().units.pythagoras,undefined);
});

test('repeated unknown rollbacks preserve distinct earlier recoveries without duplicating the latest variant',()=>{
 const old=[1,2,3].map(n=>({at:n,reason:'Earlier',written:'Ранний вариант '+n,drawing:picture(n)})),base=record({updated:1,written:'Основа',recoveries:old}),shared=backend({segments:base}),a=document(shared);let state=a.get();state.written='Последний вариант';state.drawing=picture(8);state=a.put(state);
 const remote=record({...base,updated:2,written:'Иной текущий вариант',drawing:picture(7)});
 for(let n=0;n<5;n++){shared.replace({segments:remote});const b=document(shared,a.historyEntry);const out=b.put(b.get(),'start');assert.equal(out.written,remote.written);assert.equal(out.recoveries.filter(r=>r.written===state.written).length,1);for(let k=1;k<=3;k++)assert(out.recoveries.some(r=>r.written==='Ранний вариант '+k));assert(out.recoveries.length<=4);}
});

function lesson(shared,historyState){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));const d=new JSDOM(fs.readFileSync(ROOT+'/geometry-course/atlas/segments.html','utf8'),{url:URL,runScripts:'outside-only',virtualConsole:vc,pretendToBeVisual:true}),w=d.window;
 Object.defineProperty(w,'localStorage',{value:{getItem:k=>shared.data.get(k)||null,setItem:(k,v)=>shared.data.set(k,String(v))}});w.structuredClone=structuredClone;
 w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({measureText:s=>({width:String(s).length*8})},{get:(o,k)=>o[k]||(()=>{}),set:()=>true});w.URL.createObjectURL=()=> 'blob:geometry-progress';w.URL.revokeObjectURL=()=>{};
 if(historyState)w.history.replaceState(structuredClone(historyState),'');
 for(const script of w.document.scripts)if(!script.src&&(!script.type||script.type==='text/javascript'))w.eval(script.textContent);
 return {w,errors,q:s=>w.document.querySelector(s),close:()=>w.close()};
}
test('actual standalone input handlers checkpoint research, answer and proof text synchronously before autosave',()=>{
 for(const item of [{stage:1,selector:'#observation',field:s=>s.research?.observation},{stage:4,selector:'#answer',field:s=>s.draft},{stage:5,selector:'#written',field:s=>s.written},{stage:1,selector:'#legacy-observation',field:s=>s.observation}]){
  const shared=backend(),a=lesson(shared);let h;
  try{a.q('[data-stage="'+item.stage+'"]').click();if(item.selector==='#observation'){a.q('.research-predict select').value='unsure';a.q('.research-predict').dispatchEvent(new a.w.Event('submit',{bubbles:true,cancelable:true}));}
   const literal='Ввод без ожидания '+item.selector,field=a.q(item.selector);field.value=literal;field.dispatchEvent(new a.w.Event('input',{bubbles:true}));h=structuredClone(a.w.history.state);assert.equal(item.field(h[HK].local),literal);assert.notEqual(item.field(shared.saved()),literal);assert.deepEqual(a.errors,[]);
  }finally{a.close();}
  // A new document sees the same stale bytes, with no synthetic pagehide or timer.
  const b=lesson(shared,h);try{assert.equal(b.q(item.selector).value,'Ввод без ожидания '+item.selector);assert.equal(item.field(shared.saved()),'Ввод без ожидания '+item.selector);assert.equal(shared.saved().assisted,false);assert.equal(shared.saved().independent,0);assert.deepEqual(b.errors,[]);}finally{b.close();}
 }
});
