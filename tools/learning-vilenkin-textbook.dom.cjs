'use strict';
// Synthetic accounts, actual overview and catalog. No live sessions or pupil data.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom'),catalog=require('../learning/catalog'),definitions=require('../learning/vilenkin6-textbook-catalog');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8'),tick=()=>new Promise(resolve=>setImmediate(resolve));
function pending(){let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};}
function fixture(t,{teacher=false,api,open,progress=[]}={}){
 const dom=new JSDOM('<main></main>',{url:'https://cabinet.example/learning/',runScripts:'outside-only'}),w=dom.window,host=w.document.querySelector('main'),calls=[],routes=[],reads=[];
 w.eval(read('learning/vilenkin6-textbook-catalog.js'));w.eval(read('learning/vilenkin6-textbook-course.js'));
 const dispose=w.LearningVilenkinTextbook.mount(host,{account:{id:teacher?'fixture-teacher':'fixture-pupil',role:teacher?'teacher':'student'},catalog,labels:{hinted:'Решено с подсказкой'},api:async url=>{reads.push(url);return api?api(url):{progress};},navigate:route=>routes.push(route),openContent:async(id,options)=>{calls.push(id);return open?.(id,options);}});
 t.after(()=>w.close());return{w,host,calls,routes,reads,dispose,button:id=>host.querySelector('[data-vilenkin-textbook-open="'+id+'"]')};
}
test('all selected textbook tasks are catalog-derived and separate from the unchanged legacy modules',async t=>{
 const f=fixture(t);assert([...f.host.querySelectorAll('button[data-vilenkin-textbook-open]')].every(b=>b.disabled));await tick();
 const original=definitions.filter(row=>row.unitKind!=='author-supplement'),authored=definitions.filter(row=>row.unitKind==='author-supplement');
 assert.equal(original.length,194);assert.equal(authored.length,44);
 assert.equal(f.host.querySelectorAll('[data-vilenkin-textbook-unit]').length,25);
 assert.equal(f.host.querySelectorAll('[data-vilenkin-textbook-author]').length,1);
 const ids=[...f.host.querySelectorAll('[data-vilenkin-textbook-open]')].map(b=>b.dataset.vilenkinTextbookOpen);
 assert.deepEqual(ids.filter(id=>original.some(row=>row.id===id)),original.map(row=>row.id),'All 194 original cards retain their relative order');
 assert.deepEqual(ids.filter(id=>authored.some(row=>row.id===id)),authored.map(row=>row.id),'All 44 author cards are grouped without duplicates');
 assert.deepEqual(new Set(ids),new Set(definitions.map(row=>row.id)));assert.equal(ids.length,238);
 assert.equal(catalog.items.filter(row=>row.trainerId==='vilenkin6-part1').length,27);assert.match(f.host.textContent,/не все номера учебника/);assert.match(f.host.textContent,/При потере связи/);assert.equal(f.calls.length,0);assert(f.host.querySelector('a[href="#vilenkin-legacy"]'));
 f.button(definitions[0].id).click();await tick();assert.deepEqual(f.calls,[definitions[0].id]);
});
test('resumes exact completed and unfinished attempts and ignores the legacy bank progress',async t=>{
 const [a,b]=definitions,f=fixture(t,{progress:[{trainerId:a.trainerId,contentId:a.contentId,completed:true,latest:{id:'completed_work',outcome:'hinted'}},{trainerId:b.trainerId,contentId:b.contentId,latest:{id:'started_work',outcome:'started'}},{trainerId:'vilenkin6-part1',contentId:'lesson-1',completed:true,latest:{id:'old_work'}}]});await tick();
 f.button(a.id).click();f.button(b.id).click();assert.deepEqual(f.routes,['attempt=completed_work','attempt=started_work']);assert.equal(f.calls.length,0);assert(f.host.textContent.includes('Открыто 2 из '+definitions.length+' заданий. Завершённых работ: 1'));assert.match(f.host.textContent,/Решено с подсказкой/);
});
test('review shortcuts open the original topics without starting work and return to the LCM supplement',async t=>{
 const id='vilenkin6-textbook:v6-book-2-97-д',item=catalog.get(id),progress=[{trainerId:item.trainerId,contentId:item.contentId,completed:false,latest:{id:'retained_lcm_review',outcome:'started',updatedAt:1793491200000}}],before=JSON.stringify(progress),f=fixture(t,{progress});await tick();
 const route=f.w.location.hash;
 for(const unitId of [6,7,8]){
  const target=f.host.querySelector('details[data-vilenkin-textbook-unit="'+unitId+'"]');assert(!target.open);
  f.host.querySelector('[data-vilenkin-review-unit="'+unitId+'"]').click();assert(target.open);assert.equal(f.w.document.activeElement,target.querySelector('summary'));assert.equal(f.w.location.hash,route);
  target.querySelector('[data-vilenkin-return-lcm]').click();assert.equal(f.w.document.activeElement,f.host.querySelector('[data-lcm-title]'));
 }
 assert.deepEqual(f.calls,[]);assert.deepEqual(f.routes,[]);assert.deepEqual(f.reads,['/progress']);
 assert.equal(JSON.stringify(progress),before,'Review navigation leaves the exact saved progress record untouched');
 f.button(id).click();assert.deepEqual(f.routes,['attempt=retained_lcm_review']);assert.deepEqual(f.calls,[]);
});
test('failed progress disables new starts, retry resumes saved work, disposed fetch cannot overwrite another view',async t=>{
 let n=0;const a=definitions[0],f=fixture(t,{api:async()=>{if(++n===1)throw Error('offline');return{progress:[{trainerId:a.trainerId,contentId:a.contentId,latest:{id:'saved_after_retry'}}]};}});await tick();f.button(a.id).click();assert.equal(f.calls.length,0);assert(f.button(a.id).disabled);
 f.host.querySelector('[data-vilenkin-textbook-retry]').click();await tick();f.button(a.id).click();assert.deepEqual(f.routes,['attempt=saved_after_retry']);
 const fetch=pending(),g=fixture(t,{api:()=>fetch.promise});g.dispose();g.host.innerHTML='<h1>Другой кабинет</h1>';fetch.resolve({progress:[]});await tick();assert.equal(g.host.innerHTML,'<h1>Другой кабинет</h1>');
});
test('teacher selection is read-only until explicit assignment action and opening ignores duplicate clicks',async t=>{
 const f=fixture(t,{teacher:true});assert.equal(f.reads.length,0);assert(f.host.querySelector('a[href="#course=vilenkin6"]'));f.button(definitions[0].id).click();await tick();assert.deepEqual(f.calls,[definitions[0].id]);
 const opening=pending(),g=fixture(t,{open:()=>opening.promise});await tick();g.button(definitions[1].id).click();g.button(definitions[1].id).click();assert.equal(g.calls.length,1);opening.resolve();await tick();
});
test('only the revised textbook iframe can open reference links and remains cross-origin sandboxed',t=>{
 const dom=new JSDOM('<main></main>',{url:'https://cabinet.example/learning/',runScripts:'outside-only'}),w=dom.window;t.after(()=>w.close());w.ResizeObserver=class{observe(){}disconnect(){}};w.eval(read('learning/trainer-frame.js'));
 for(const trainerId of ['vilenkin6-textbook','vilenkin6-part1']){
  const item=catalog.items.find(x=>x.trainerId===trainerId),frame=new w.LearningTrainerFrame(w.document.querySelector('main'),{item,attempt:{state:{},taskSpec:{}}});
  assert.equal(frame.iframe.getAttribute('sandbox'),'allow-scripts allow-same-origin'+(trainerId==='vilenkin6-textbook'?' allow-popups allow-forms':''));assert.equal(frame.iframe.referrerPolicy,'no-referrer');assert.notEqual(new URL(frame.iframe.src).origin,w.location.origin);frame.destroy();
 }
});

test('an explicit fresh-current action leaves the saved attempt available for historical revisions',async t=>{
 const row=definitions[0],opened=[],f=fixture(t,{progress:[{trainerId:row.trainerId,contentId:row.contentId,latest:{id:'historical_source'}}],open:(id,options)=>opened.push({id,options})});await tick();
 f.host.querySelector('[data-vilenkin-textbook-fresh="'+row.id+'"]').click();await tick();assert.deepEqual(JSON.parse(JSON.stringify(opened)),[{id:row.id,options:{fresh:true,sourceAttemptId:'historical_source'}}]);f.button(row.id).click();assert.deepEqual(f.routes,['attempt=historical_source']);
});

test('primary course action starts once across both buttons and resumes an unfinished saved task',async t=>{
 const opening=pending(),f=fixture(t,{open:()=>opening.promise});
 const start=f.host.querySelector('[data-vilenkin-textbook-start]');assert(start.disabled);await tick();
 start.click();f.button(definitions[0].id).click();assert.deepEqual(f.calls,[definitions[0].id]);opening.resolve();await tick();
 const [done,unfinished]=definitions,g=fixture(t,{progress:[
  {trainerId:done.trainerId,contentId:done.contentId,completed:true,latest:{id:'finished',outcome:'independent'}},
  {trainerId:unfinished.trainerId,contentId:unfinished.contentId,completed:false,latest:{id:'unfinished',outcome:'started'}}
 ]});await tick();
 const resume=g.host.querySelector('[data-vilenkin-textbook-start]');assert.match(resume.textContent,/Продолжить/);resume.click();
 assert.deepEqual(g.routes,['attempt=unfinished']);assert.equal(g.calls.length,0);
});

test('topic selection and completed-course action only reveal navigation, with truthful progress',async t=>{
 const f=fixture(t,{progress:definitions.map((row,i)=>({trainerId:row.trainerId,contentId:row.contentId,completed:true,latest:{id:'done_'+i,outcome:'independent'}}))});await tick();
 const heading=f.host.querySelector('[data-v6-topics-heading]');assert(heading);assert.equal(heading.getAttribute('tabindex'),'-1');
 assert.equal(heading.parentElement.nextElementSibling,f.host.querySelector('[data-vilenkin-textbook-author]'),'The shared heading reveals the author supplement before the original topics');
 f.host.querySelector('[data-vilenkin-textbook-choose-topic]').click();assert.equal(f.w.document.activeElement,heading);
 f.host.querySelector('[data-vilenkin-textbook-start]').click();assert.equal(f.w.document.activeElement,heading);
 assert.equal(f.calls.length,0);assert.equal(f.routes.length,0);assert.equal(f.host.querySelector('[data-v6-progress-bar]').value,definitions.length);
 assert.equal(f.host.querySelector('[data-v6-completed]').textContent,String(definitions.length));
});

test('an unfinished repeat remains resumable even when earlier work completed every task',async t=>{
 const row=definitions[1],f=fixture(t,{progress:definitions.map((item,i)=>({trainerId:item.trainerId,contentId:item.contentId,completed:true,latest:{id:i===1?'unfinished_repeat':'finished_'+i,outcome:i===1?'started':'independent'}}))});await tick();
 assert.match(f.button(row.id).textContent,/Продолжить/);assert.equal(f.host.querySelector('[data-vilenkin-textbook-status="'+row.id+'"]').dataset.state,'started');
 f.host.querySelector('[data-vilenkin-textbook-start]').click();assert.deepEqual(f.routes,['attempt=unfinished_repeat']);assert.equal(f.calls.length,0);
 assert.equal(f.host.querySelector('[data-v6-progress-bar]').value,definitions.length,'Prior achievements remain in aggregate progress');
});

test('author groups preserve both method labels and progress actions while every start shares one opening lock',async t=>{
 const authored=definitions.filter(row=>row.source?.kind==='author'),[chain,factors]=authored,opening=pending(),f=fixture(t,{open:()=>opening.promise,progress:[
  {trainerId:chain.trainerId,contentId:chain.contentId,completed:true,latest:{id:'chain_done',outcome:'independent'}},
  {trainerId:factors.trainerId,contentId:factors.contentId,completed:false,latest:{id:'factors_started',outcome:'started'}}
 ]});await tick();
 const section=f.host.querySelector('[data-vilenkin-textbook-author]');
 for(const [stage,count] of Object.entries({example:3,practice:16,check:6}))assert.equal(section.querySelectorAll('[data-lcm-stage="'+stage+'"] [data-lcm-group]').length,count);
 assert.equal(section.querySelectorAll('[data-vilenkin-textbook-open]').length,44);
 for(const row of authored){
  const button=f.button(row.id),label=row.method==='chain'?'По очереди':'Через простые множители';
  assert(button.querySelector('[data-v6-method-label]').textContent.startsWith(label));assert(button.getAttribute('aria-label').includes(label));
 }
 assert.equal(f.button(chain.id).querySelector('[data-v6-action-label]').textContent,'Посмотреть работу');
 assert.equal(f.button(factors.id).querySelector('[data-v6-action-label]').textContent,'Продолжить');
 assert.match(section.querySelector('[data-vilenkin-textbook-unit-progress]').textContent,/44 заданий · начато 2 · завершено 1/);
 f.button(definitions[0].id).click();f.button(authored[2].id).click();f.host.querySelector('[data-vilenkin-textbook-start]').click();
 const fresh=f.host.querySelector('[data-vilenkin-textbook-fresh="'+chain.id+'"]');fresh.click();
 assert(fresh.disabled);assert([...f.host.querySelectorAll('[data-vilenkin-textbook-open]')].every(button=>button.disabled));assert.deepEqual(f.calls,[definitions[0].id]);assert.deepEqual(f.routes,[]);
 opening.resolve();await tick();assert(!f.button(authored[2].id).disabled);assert(!fresh.disabled);
});

test('primary Continue selects the latest numeric API timestamp across original tasks and both author methods',async t=>{
 const original=definitions[0],[chain,factors,done]=definitions.filter(row=>row.source?.kind==='author'),progress=[
  {trainerId:original.trainerId,contentId:original.contentId,completed:false,latest:{id:'original_older',outcome:'started',updatedAt:1793491200000}},
  {trainerId:chain.trainerId,contentId:chain.contentId,completed:false,latest:{id:'chain_newer',outcome:'started',updatedAt:1793491260000}},
  {trainerId:factors.trainerId,contentId:factors.contentId,completed:false,latest:{id:'factors_newest',outcome:'started',updatedAt:1793491320000}},
  {trainerId:done.trainerId,contentId:done.contentId,completed:true,latest:{id:'done_later',outcome:'independent',updatedAt:1793491380000}}
 ].reverse(),before=JSON.stringify(progress),f=fixture(t,{progress});await tick();
 f.host.querySelector('[data-vilenkin-textbook-start]').click();assert.deepEqual(f.routes,['attempt=factors_newest']);assert.deepEqual(f.calls,[]);
 assert.match(f.host.querySelector('[data-vilenkin-textbook-next]').textContent,/Через простые множители/);assert.equal(JSON.stringify(progress),before);
});

test('Continue accepts ISO activity and falls back to creation only when the update timestamp is invalid or absent',async t=>{
 const original=definitions[0],[chain,factors]=definitions.filter(row=>row.source?.kind==='author'),f=fixture(t,{progress:[
  {trainerId:original.trainerId,contentId:original.contentId,latest:{id:'original_iso',outcome:'started',updatedAt:'2026-11-01T00:00:00.000Z'}},
  {trainerId:chain.trainerId,contentId:chain.contentId,latest:{id:'chain_creation_fallback',outcome:'started',updatedAt:'invalid',createdAt:'2026-11-01T02:00:00.000Z'}},
  {trainerId:factors.trainerId,contentId:factors.contentId,latest:{id:'factors_valid_update',outcome:'started',updatedAt:'2026-11-01T01:00:00.000Z',createdAt:'2026-11-01T04:00:00.000Z'}}
 ]});await tick();
 f.host.querySelector('[data-vilenkin-textbook-start]').click();assert.deepEqual(f.routes,['attempt=chain_creation_fallback']);assert.deepEqual(f.calls,[]);
 const g=fixture(t,{progress:[
  {trainerId:original.trainerId,contentId:original.contentId,latest:{id:'original_no_dates',outcome:'started'}},
  {trainerId:factors.trainerId,contentId:factors.contentId,latest:{id:'numeric_creation',outcome:'started',createdAt:1793491200000}}
 ]});await tick();g.host.querySelector('[data-vilenkin-textbook-start]').click();assert.deepEqual(g.routes,['attempt=numeric_creation']);assert.deepEqual(g.calls,[]);
});

test('missing or equal dates retain stable catalogue order and a zero update is a valid timestamp',async t=>{
 const original=definitions[0],[chain,factors]=definitions.filter(row=>row.source?.kind==='author');
 for(const dates of [{}, {updatedAt:1793491200000}]){
  const f=fixture(t,{progress:[factors,chain,original].map(row=>({trainerId:row.trainerId,contentId:row.contentId,latest:{id:row===original?'catalogue_first':'author_'+row.method,outcome:'started',...dates}}))});await tick();
  f.host.querySelector('[data-vilenkin-textbook-start]').click();assert.deepEqual(f.routes,['attempt=catalogue_first']);assert.deepEqual(f.calls,[]);
 }
 const g=fixture(t,{progress:[
  {trainerId:original.trainerId,contentId:original.contentId,latest:{id:'invalid_dates',outcome:'started',updatedAt:NaN,createdAt:'invalid'}},
  {trainerId:chain.trainerId,contentId:chain.contentId,latest:{id:'zero_update',outcome:'started',updatedAt:0,createdAt:100}},
  {trainerId:factors.trainerId,contentId:factors.contentId,latest:{id:'one_creation',outcome:'started',updatedAt:Infinity,createdAt:1}}
 ]});await tick();g.host.querySelector('[data-vilenkin-textbook-start]').click();assert.deepEqual(g.routes,['attempt=one_creation']);assert.deepEqual(g.calls,[]);
});

test('disposed course controls cannot navigate, open work or change the replacement view',async t=>{
 const f=fixture(t);await tick();
 const controls=[f.host.querySelector('[data-vilenkin-review-unit="6"]'),f.host.querySelector('[data-vilenkin-return-lcm]'),f.host.querySelector('[data-vilenkin-textbook-choose-topic]'),f.host.querySelector('[data-vilenkin-textbook-start]'),f.button(definitions[0].id)];
 f.dispose();f.host.innerHTML='<button id="replacement">Другой кабинет</button>';const replacement=f.host.querySelector('button');replacement.focus();
 for(const control of controls)control.click();await tick();
 assert.equal(f.host.innerHTML,'<button id="replacement">Другой кабинет</button>');assert.equal(f.w.document.activeElement,replacement);
 assert.deepEqual(f.calls,[]);assert.deepEqual(f.routes,[]);assert.deepEqual(f.reads,['/progress']);
});
