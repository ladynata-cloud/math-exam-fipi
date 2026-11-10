'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
function fixture(race){
 const dom=new JSDOM(read('foundations/route.html'),{url:'https://fixture.test/foundations/route.html#number-parts?session=check-a',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,errors=[];w.addEventListener('error',e=>errors.push(e.error?.message||e.message));
 for(const p of ['learning/division-course-map.js','learning/preparation-map.js','foundations/route-core.js','foundations/route-store.js','foundations/route-visuals.js','foundations/routes-arithmetic.js','foundations/routes-number-sense.js','foundations/routes-algebra-geometry.js','foundations/route-catalog.js'])w.eval(read(p));
 const C=w.FoundationRoutesCore,cat=w.FoundationRoutes,r=cat.byId['number-parts'],factory=w.FoundationRouteStore.create;
 let once=false;
 w.FoundationRouteStore.create=(...args)=>{
  const api=factory(...args),act=api.act;
  function clear(){for(const key of Object.keys(w.localStorage))if(key.startsWith(C.PREFIX))w.localStorage.removeItem(key);}
  api.act=(id,type,q,value)=>{
   if(!once&&type===race.trigger){once=true;
    if(race.operation==='delete')clear();
    if(race.operation==='advance')act(id,'submit',C.questions(r,'check-a')[0].id,String(C.questions(r,'check-a')[0].answer));
    if(race.operation==='finish'){for(const item of C.questions(r,'check-a'))act(id,'submit',item.id,String(item.answer));act(id,'finish');}
   }
   return act(id,type,q,value);
  };
  return api;
 };
 w.eval(read('foundations/route-page.js'));return{dom,w,C,r,errors};
}
test('peer advances during view: the visible condition and restored item belong to the same current step',()=>{
 const f=fixture({trigger:'view',operation:'advance'});
 try{assert.equal(f.w.document.querySelector('#question-title').textContent,f.C.questions(f.r,'check-a')[1].prompt);assert.deepEqual(f.errors,[]);}finally{f.dom.window.close();}
});
test('peer finishes during view: result is rendered without mixing a stale question and missing item',()=>{
 const f=fixture({trigger:'view',operation:'finish'});
 try{assert.match(f.w.document.querySelector('#result-title').textContent,/Самостоятельная проверка пройдена/);assert.deepEqual(f.errors,[]);}finally{f.dom.window.close();}
});
test('peer deletes events during view: a clear return replaces the missing session',()=>{
 const f=fixture({trigger:'view',operation:'delete'});
 try{assert.equal(f.w.document.querySelector('#peer-notice').hidden,false);assert.match(f.w.document.querySelector('#peer-notice').textContent,/удалена/);assert.equal(f.w.document.querySelector('#answer-form'),null);assert.deepEqual(f.errors,[]);}finally{f.dom.window.close();}
});
test('peer deletes events between before-read and submit: no null state is dereferenced',()=>{
 const f=fixture({trigger:'submit',operation:'delete'});
 try{const q=f.C.questions(f.r,'check-a')[0],form=f.w.document.querySelector('#answer-form');
 if(q.input==='choice'){[...form.querySelectorAll('input')].find(n=>n.value===String(q.answer)).checked=true;}else form.querySelector('input').value=String(q.answer);
 form.dispatchEvent(new f.w.Event('submit',{bubbles:true,cancelable:true}));
 assert.equal(f.w.document.querySelector('#peer-notice').hidden,false);assert.match(f.w.document.querySelector('#peer-notice').textContent,/удалена/);assert.deepEqual(f.errors,[]);
 }finally{f.dom.window.close();}
});
test('peer completes between before-read and submit: a stale wrong input is not called correct',()=>{
 const f=fixture({trigger:'submit',operation:'advance'});
 try{const form=f.w.document.querySelector('#answer-form'),q=f.C.questions(f.r,'check-a')[0];
 if(q.input==='choice'){[...form.querySelectorAll('input')].find(n=>n.value!==String(q.answer)).checked=true;}else form.querySelector('input').value='9999999';
 form.dispatchEvent(new f.w.Event('submit',{bubbles:true,cancelable:true}));
 assert.match(f.w.document.querySelector('#answer-feedback').textContent,/новый ввод здесь не проверялся/);assert.equal(f.w.document.querySelector('#next-question').hidden,false);assert.deepEqual(f.errors,[]);
 }finally{f.dom.window.close();}
});
