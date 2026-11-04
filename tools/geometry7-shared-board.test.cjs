'use strict';
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {resolve}=require('node:path');
const {JSDOM}=require('jsdom');
const {test}=require('node:test');
const ROOT=resolve(__dirname,'..');
function fixture(){
 const dom=new JSDOM(readFileSync(resolve(ROOT,'trainers/atanasyan-grade7.html'),'utf8'),{url:'https://local.example/trainers/atanasyan-grade7.html',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;w.TextEncoder=TextEncoder;w.HTMLElement.prototype.scrollIntoView=()=>{};
 let config;w.MathExamBoard={register:c=>{config=c;return {destroy(){}};}};
 Object.defineProperty(w,'localStorage',{get(){throw Error('Private storage access');}});
 for(const p of ['geometry-course/textbook/assets/math-text.js','geometry-course/textbook/assets/planar-viewer.js','geometry-course/textbook/assets/grade7-board-engine.js','geometry-course/textbook/assets/grade7-board-session.js'])w.eval(readFileSync(resolve(ROOT,p),'utf8'));
 const bundle=w.JSON.parse(readFileSync(resolve(ROOT,'geometry-course/textbook/data/course.json'),'utf8'));
 const app=w.AtanasyanGrade7Board.boot(bundle,w.document.getElementById('textbook-app'));
 return {dom,w,app,get config(){return config;},close(){app.app.destroy();app.session.destroy();w.close();}};
}
test('grade 7 textbook: all 619 cards, private isolation, catalog and reasoning round trip',()=>{
 const f=fixture();try{
 assert.equal(f.app.app.coverage.available,619);assert.equal(f.app.app.issues.length,0);
 let s=f.config.getState();assert.equal(s.lessonId,null);assert(f.w.__atanasyanGrade7Board.validateState(s));
 const search=f.w.document.getElementById('catalog-search');search.value='161';search.dispatchEvent(new f.w.Event('input',{bubbles:true}));s=f.config.getState();f.config.applyState(s);assert.deepEqual(JSON.parse(JSON.stringify(f.config.getState())),JSON.parse(JSON.stringify(s)));
 for(const id of ['atanasyan-7-9-main-92-part-1','atanasyan-7-9-main-161-part-1','atanasyan-7-9-main-223-part-1']){
 assert(f.app.app.open(id),id);const input=f.w.document.getElementById('final-answer');input.value='Синтетическое рассуждение: равные стороны.';input.dispatchEvent(new f.w.Event('input',{bubbles:true}));
 s=f.config.getState();assert(f.w.__atanasyanGrade7Board.validateState(s),JSON.stringify(s));f.config.applyState(s);assert.deepEqual(JSON.parse(JSON.stringify(f.config.getState())),JSON.parse(JSON.stringify(s)));
 }
 }finally{f.close();}
});
test('all native entries and board metadata are complete',()=>{
 const catalog=JSON.parse(readFileSync(resolve(ROOT,'geometry-course/board/catalog.json')));assert.equal(catalog.length,70);assert.equal(new Set(catalog.map(x=>x.id)).size,70);
 for(const x of catalog){const text=readFileSync(resolve(ROOT,'geometry-course/trainers/'+x.id+'.html'),'utf8');assert(text.includes('/geometry-course/board/native-session.js'));assert(text.includes('/geometry-course/board/learning-support.js'));assert(!/addEventListener\(['"](?:mousedown|touchstart)/.test(text),'All '+x.id+' canvas input uses captured pointer events');}
 const registry=JSON.parse(readFileSync(resolve(ROOT,'trainers/board-compat.json')));for(const id of ['atanasyan-grade7','geometry7-practice'])assert.equal(registry.trainers.find(x=>x.trainerId===id).allowLegacyHtml,false);
});
test('all managed grade 7 geometry families use the existing board and preserve model snapshots',()=>{
 const dom=new JSDOM(readFileSync(resolve(ROOT,'trainers/geometry7-rebuild.html'),'utf8'),{url:'https://local.example/trainers/geometry7-rebuild.html',runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;w.TextEncoder=TextEncoder;w.HTMLElement.prototype.scrollIntoView=()=>{};let config;
 Object.defineProperty(w,'localStorage',{get(){throw Error('Private store touched');}});w.MathExamBoard={register:c=>{config=c;return {destroy(){}};}};
 try{
  for(const el of w.document.querySelectorAll('script[src]')){const file=new URL(el.src).pathname;if(file!=='/trainers/board-bridge.js')w.eval(readFileSync(resolve(ROOT,'.'+file),'utf8'));}
  assert(config);assert.equal(config.id,'geometry7-rebuild');const families=w.BazaBoard.LESSONS[7];assert(families.length>=103);
  for(const id of families){w.__bazaBoard.navigate('#lesson='+id);assert(!w.document.querySelector('.task-first-heading .eyebrow').textContent.includes('ЕГЭ'));assert.equal(w.document.querySelector('#typeSelect').options.length,families.length);assert([...w.document.querySelector('#typeSelect').options].every(o=>families.includes(o.value)));const state=config.getState();assert(w.__bazaBoard.validateState(state),id);config.applyState(state);assert.deepEqual(JSON.parse(JSON.stringify(config.getState())),JSON.parse(JSON.stringify(state)),id);}
  console.log('Managed geometry families:',families.length);
 }finally{dom.window.close();}
});

test('board-only engine projection tracks the reviewed personal engine',()=>{
 const base=readFileSync(resolve(ROOT,'geometry-course/textbook/assets/engine.js'));
 const board=readFileSync(resolve(ROOT,'geometry-course/textbook/assets/grade7-board-engine.js'),'utf8');
 assert.equal(board.match(/Reviewed source SHA-256: ([a-f0-9]{64})/)[1],require('node:crypto').createHash('sha256').update(base).digest('hex'),'Review and port engine changes deliberately; do not change public review receipts');
});
test('native typed snapshot rejects malformed state atomically and retains mathematical text',async()=>{
 const dom=new JSDOM(readFileSync(resolve(ROOT,'trainers/geometry7-practice.html'),'utf8'),{url:'https://local.example/trainers/geometry7-practice.html',runScripts:'outside-only'}),w=dom.window;
 w.TextEncoder=TextEncoder;w.fetch=async()=>({ok:true,json:async()=>w.JSON.parse(readFileSync(resolve(ROOT,'geometry-course/board/catalog.json'),'utf8'))});w.MathExamBoard={register(){}};
 try{w.eval(readFileSync(resolve(ROOT,'geometry-course/board/practice.js'),'utf8'));await new Promise(r=>setTimeout(r,0));
 const api=w.Geometry7Practice,initial=api.getState(),copy=x=>w.JSON.parse(JSON.stringify(x));assert(api.validateState(initial));
 for(const mutate of [s=>s.activity='../../private',s=>s.version=2,s=>s.actions=[[0,'script',0,'button',null]],s=>s.actions=[[0,'input',0,'textarea','<img src=x>']],s=>s.actions=[[0,'click',999,'button',null]],s=>s.time=86400001,s=>s.extra=true]){const s=copy(initial);mutate(s);assert.equal(api.validateState(s),false);assert.throws(()=>api.applyState(s));assert.deepEqual(api.getState(),initial);}
 const good=copy(initial);good.actions=[[0,'input',0,'textarea','~g7-text~'+JSON.stringify('a<b>c').replace(/</g,'\\u003c').replace(/>/g,'\\u003e')]];assert(api.validateState(good));
 }finally{w.close();}
});
