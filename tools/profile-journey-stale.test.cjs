'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom'),{resolvePublicScript}=require('./public-page-script.cjs');
const root=path.resolve(__dirname,'..'),KEY='mathexam.profileStart2027.v1';
const lesson=require('../ege-profil/start/geometry-data.js').find(l=>l.id==='geo-right');
const first=lesson.tasks.slice(-3)[0];
function boot(hash){
 const file=path.join(root,'ege-profil/start/index.html'),dom=new JSDOM(fs.readFileSync(file,'utf8'),{url:'https://mathexam.space/ege-profil/start/index.html'+hash,runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
 w.localStorage.setItem(KEY,JSON.stringify({version:1,records:{[lesson.id]:{guided:[],independent:[first.id],attempts:1}},seen:{[first.id]:1},sessions:{[lesson.id+':independent']:{taskId:first.id,step:0,wrong:false,assisted:false,familiar:false,done:true,draft:String(first.answer),answers:[String(first.answer)],started:'2026-11-09T10:00:00.000Z',registered:true}}}));
 w.localStorage.setItem('unrelated-progress','keep');
 for(const script of w.document.querySelectorAll('script[src]'))w.eval(fs.readFileSync(resolvePublicScript(root,path.dirname(file),script.getAttribute('src')),'utf8'));
 return dom;
}
function saved(w){return JSON.parse(w.localStorage.getItem(KEY));}
const entrances=[
 {name:'course overview',hash:'#calm',selector:'[data-journey-start]'},
 {name:'number catalogue',hash:'#calm/1',selector:'[data-exam-start="1"]'},
 {name:'progress report',hash:'#progress',selector:'#progress-continue'}
];
for(const entry of entrances){
 test(entry.name+' continuation preserves a newer second-tab attempt and draft',async()=>{
  const dom=boot(entry.hash),w=dom.window,d=w.document;
  try{
   const link=d.querySelector(entry.selector);assert(link);assert.equal(link.getAttribute('href'),'#practice/geo-right/independent');
   // A separate state controller shares storage exactly as another tab does.
   // The first page intentionally retains its already-rendered fresh=true CTA.
   const second=w.ProfileState.create(w.ProfileLessons,w.localStorage),session=second.start(lesson.id,'independent',true);
   session.draft='123/7';second.persist();const before=saved(w),expected=before.sessions[lesson.id+':independent'];
   assert.notEqual(expected.taskId,first.id);assert.equal(expected.done,false);
   const navigation=new Promise(resolve=>w.addEventListener('hashchange',resolve,{once:true}));link.click();await navigation;
   const after=saved(w);
   assert.deepEqual(after.sessions[lesson.id+':independent'],expected,'stale continuation must not replace the newer condition or its work');
   assert.deepEqual(after.seen,before.seen,'continuing must not expose another condition');
   for(const [id,record] of Object.entries(before.records))assert.deepEqual(after.records[id],record,'continuing must preserve earned evidence');
   // Catalogue rendering already initializes empty records in memory; they
   // may be flushed on a click, but must not acquire attempts or successes.
   for(const [id,record] of Object.entries(after.records))if(!Object.hasOwn(before.records,id))assert.deepEqual(record,{guided:[],independent:[],attempts:0});
   assert.equal(d.getElementById('answer').value,'123/7');assert.equal(w.localStorage.getItem('unrelated-progress'),'keep');
  }finally{w.close();}
 });
 test(entry.name+' continuation still opens a new condition when the refreshed attempt is completed',async()=>{
  const dom=boot(entry.hash),w=dom.window,d=w.document;
  try{
   const navigation=new Promise(resolve=>w.addEventListener('hashchange',resolve,{once:true}));d.querySelector(entry.selector).click();await navigation;
   const after=saved(w),session=after.sessions[lesson.id+':independent'];
   assert.notEqual(session.taskId,first.id);assert.equal(session.done,false);assert.equal(session.draft,'');
   assert.equal(d.getElementById('answer').value,'');assert.deepEqual(after.records[lesson.id].independent,[first.id]);
   assert.equal(after.records[lesson.id].attempts,1);assert.equal(Object.keys(after.seen).length,2);
  }finally{w.close();}
 });
}
