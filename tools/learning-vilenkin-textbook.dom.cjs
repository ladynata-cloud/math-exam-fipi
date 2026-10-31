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
 const id='vilenkin6-textbook:v6-book-2-97-д',item=catalog.get(id),f=fixture(t,{progress:[{trainerId:item.trainerId,contentId:item.contentId,latest:{id:'retained_lcm_review'}}]});await tick();
 const route=f.w.location.hash;
 for(const unitId of [6,7,8]){
  const target=f.host.querySelector('details[data-vilenkin-textbook-unit="'+unitId+'"]');assert(!target.open);
  f.host.querySelector('[data-vilenkin-review-unit="'+unitId+'"]').click();assert(target.open);assert.equal(f.w.document.activeElement,target.querySelector('summary'));assert.equal(f.w.location.hash,route);
  target.querySelector('[data-vilenkin-return-lcm]').click();assert.equal(f.w.document.activeElement,f.host.querySelector('[data-lcm-title]'));
 }
 assert.deepEqual(f.calls,[]);assert.deepEqual(f.routes,[]);assert.deepEqual(f.reads,['/progress']);
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
