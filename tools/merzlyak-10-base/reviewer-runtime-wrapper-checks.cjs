'use strict';
// Independent entry-page checks. All network operations are replaced by local responses.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'../..'),course=path.join(root,'stereo-course/merzlyak-10-base');
const html=fs.readFileSync(path.join(course,'index.html'),'utf8');
const bundle=JSON.parse(fs.readFileSync(path.join(course,'data/course.json'),'utf8'));
const scripts=[...html.matchAll(/<script(?: src="([^"]+)")?>([\s\S]*?)<\/script>/g)];
assert.equal(scripts.length,4);
for(const [,src] of scripts)if(src){assert(!/^(?:https?:)?\/\//.test(src));assert(fs.existsSync(path.resolve(course,src)),src);}
async function boot(fetchResult){
 const dom=new JSDOM(html,{url:'https://example.test/stereo-course/merzlyak-10-base/',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,errors=[],requests=[];w.addEventListener('error',e=>errors.push(e.error));
 w.fetch=async(url,options)=>{requests.push({url,options});return fetchResult();};
 for(const [,src,inline] of scripts)w.eval(src?fs.readFileSync(path.resolve(course,src),'utf8'):inline);
 await new Promise(resolve=>setTimeout(resolve,10));
 assert.equal(requests.length,1);assert.equal(requests[0].url,'data/course.json');assert.equal(requests[0].options.cache,'no-cache');
 assert.equal(errors.length,0);
 return {w,doc:w.document,close(){w.textbookApp?.destroy();w.close();}};
}
function reviewedIds(data){
 const entries=new Map(data.catalog.entries.map(entry=>[entry.id,entry]));
 return new Set(data.lessons.filter(lesson=>lesson.status==='reviewed'&&entries.get(lesson.id)?.status==='reviewed'&&['source','mathematics','pedagogy'].every(kind=>lesson.review?.[kind]==='passed')).map(lesson=>lesson.id));
}
async function checkCatalog(data,label){
 const app=await boot(()=>({ok:true,json:async()=>data}));
 const ready=reviewedIds(data);
 assert(app.w.textbookApp,'entry wrapper mounted the real isolated runtime');
 assert.equal(app.w.textbookApp.coverage.inventoried,data.catalog.entries.length,label);
 assert.equal(app.w.textbookApp.coverage.available,ready.size,label+': full reviewed count');
 assert.equal(app.doc.querySelectorAll('[data-catalog-ready] [data-lesson]').length,Math.min(24,ready.size),label+': first page has at most24 reviewed buttons');
 const collection=app.doc.getElementById('catalog-collection');collection.value='main';collection.dispatchEvent(new app.w.Event('change',{bubbles:true}));
 for(const query of ['1.1','№1.1','№ 1.1','1.10','11.1']){
  const number=query.replace(/^№\s*/,'');
  const entries=data.catalog.entries.filter(entry=>entry.source.collection==='main'&&entry.source.exercise===number);
  assert.equal(entries.length,1,'test searches a single authored source card: '+number);
  const expected=entries[0],isReady=ready.has(expected.id);
  const field=app.doc.getElementById('catalog-search');field.value=query;field.dispatchEvent(new app.w.Event('input',{bubbles:true}));
  const buttons=[...app.doc.querySelectorAll('[data-catalog-ready] [data-lesson]')];
  const pending=[...app.doc.querySelectorAll('[data-catalog-pending] article')];
  assert.equal(buttons.length,isReady?1:0,label+': '+query);
  assert.equal(pending.length,isReady?0:1,label+': '+query);
  if(isReady)assert.equal(buttons[0].dataset.lesson,expected.id);
  else assert(pending[0].querySelector('h3').textContent.startsWith('№ '+number+' ·'));
 }
 app.close();return ready.size;
}
(async()=>{
 const actualReady=await checkCatalog(bundle,'actual bundle');
 const forcedDraft=JSON.parse(JSON.stringify(bundle));
 for(const entry of forcedDraft.catalog.entries)entry.status='draft';
 for(const lesson of forcedDraft.lessons){lesson.status='draft';lesson.review={source:'pending',mathematics:'pending',pedagogy:'pending'};}
 const draftReady=await checkCatalog(forcedDraft,'forced draft negative boundary');
 assert.equal(draftReady,0,'all-draft copy must not publish lessons');
 for(const response of [()=>({ok:false}),()=>{throw Error('offline');},()=>({ok:true,json:async()=>{throw Error('invalid JSON');}}),()=>({ok:true,json:async()=>({})})]){
  const failed=await boot(response);assert.equal(failed.w.textbookApp,undefined);assert.match(failed.doc.getElementById('textbook-app').textContent,/Материалы сейчас не удалось открыть/);failed.close();
 }
 console.log('INDEPENDENT_WRAPPER_OK',JSON.stringify({catalogEntries:bundle.catalog.entries.length,actualReady,forcedDraftReady:draftReady,checks:'local scripts, cache policy, publication count/pagination, forced-draft boundary, exact ready/pending decimal search, HTTP/network/JSON/catalog failure states'}));
})().catch(error=>{console.error(error);process.exitCode=1;});
