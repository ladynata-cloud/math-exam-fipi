'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const Ajv=require('ajv/dist/2020');
const root=path.resolve(__dirname,'../..');
const course=path.join(root,'stereo-course/merzlyak-10-base');
const shared=path.join(root,'stereo-course/assets');
const runtime=path.join(course,'assets/engine.js');
const API=require(runtime);
const clone=value=>JSON.parse(JSON.stringify(value));
const fixture=clone(require('../stereo-textbook/fixtures/course.json'));
const bookId='merzlyak-2022-10-base';

// Adapt only engineering fixtures. These records are never course materials.
function adaptSources(value){
 if(!value||typeof value!=='object')return;
 if(value.bookId)value.bookId=bookId;
 if(Array.isArray(value.printedPages))value.pdfPages=value.printedPages.map(n=>n+1);
 for(const child of Object.values(value))adaptSources(child);
}
adaptSources(fixture);
fixture.catalog.book={id:bookId,title:'TEST ONLY Мерзляк',edition:'TEST ONLY 2022',pdfPageCount:209};
for(const record of [...fixture.catalog.entries,...fixture.lessons]){
 if(record.id==='fixture-exercise')record.source.exercise='1.1';
 if(record.id==='fixture-proof')record.source.exercise='1.10';
}
const third=clone(fixture.lessons.find(lesson=>lesson.id==='fixture-exercise'));
third.id='fixture-eleven';third.title='TEST ONLY №11.1';third.source.exercise='11.1';
fixture.lessons.push(third);
fixture.catalog.entries.push(Object.fromEntries(['id','revision','kind','title','status','source'].map(key=>[key,clone(third[key])])));
const allow={allowTestFixtures:true};
assert.deepEqual(API.inspectBundle(fixture.catalog,fixture.lessons,allow).issues,[]);
assert.equal(API.inspectBundle(fixture.catalog,fixture.lessons,allow).coverage.available,4);
assert.equal(API.inspectBundle(fixture.catalog,fixture.lessons).coverage.available,0,'test fixtures are never publishable by default');

const ajv=new Ajv({allErrors:true,strict:true});
require('ajv-formats')(ajv);
const schemas=path.join(root,'stereo-course/textbook/schema');
const validCatalog=ajv.compile(JSON.parse(fs.readFileSync(path.join(schemas,'catalog.schema.json'),'utf8')));
const validLesson=ajv.compile(JSON.parse(fs.readFileSync(path.join(schemas,'lesson.schema.json'),'utf8')));
function validateBundle(bundle,label){
 assert(validCatalog(bundle.catalog),label+': '+JSON.stringify(validCatalog.errors));
 for(const lesson of bundle.lessons){
  assert(validLesson(lesson),lesson.id+': '+JSON.stringify(validLesson.errors));
  assert.deepEqual(API.validateLesson(lesson,bundle.catalog.book),[],lesson.id);
 }
}
validateBundle(fixture,'engineering fixture');

// Merzlyak's actual page offset must pass; Atanasyan's offset must fail.
const wrongOffset=clone(fixture);
wrongOffset.lessons[0].source.pdfPages=wrongOffset.lessons[0].source.printedPages.map(n=>n+2);
assert(API.validateLesson(wrongOffset.lessons[0],wrongOffset.catalog.book).some(error=>/page mismatch/.test(error)));
assert.equal(API.inspectBundle(wrongOffset.catalog,wrongOffset.lessons,allow).coverage.blocked,1);
const unreviewed=clone(fixture);
unreviewed.lessons[0].review.mathematics='pending';
assert.equal(API.inspectBundle(unreviewed.catalog,unreviewed.lessons,allow).coverage.available,3,'pending mathematical review blocks publication');
const draft=clone(fixture);
draft.catalog.entries[0].status=draft.lessons[0].status='draft';
assert.equal(API.inspectBundle(draft.catalog,draft.lessons,allow).coverage.available,3,'a complete draft remains unavailable');

// Guard the isolated fork against accidental unrelated runtime changes.
const retained=fs.readFileSync(path.join(root,'stereo-course/textbook/assets/engine.js'),'utf8')
 .replace('source.pdfPages[i]!==n+2','source.pdfPages[i]!==n+1')
 .replace('q.match(/^(?:№\\s*)?(\\d+)$/)','q.match(/^(?:№\\s*)?(\\d+(?:\\.\\d+)?)$/)');
const isolated=fs.readFileSync(runtime,'utf8');
const boardBlocks=isolated.match(/\n \/\* MERZLYAK_BOARD_BEGIN:[\s\S]*?\/\* MERZLYAK_BOARD_END \*\//g)||[];
assert.equal(boardBlocks.length,3,'exactly three delimited optional board additions');
assert.equal(isolated.replace(/\n \/\* MERZLYAK_BOARD_BEGIN:[\s\S]*?\/\* MERZLYAK_BOARD_END \*\//g,''),retained,'outside the tested optional board additions only source offset and exact decimal-number search differ from retained engine');

function boot(saved={}){
 const dom=new JSDOM('<div id="app"></div>',{url:'https://example.test/stereo-course/merzlyak-10-base/',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,doc=w.document,errors=[],mounts=[];
 w.addEventListener('error',event=>errors.push(event.error));
 w.HTMLElement.prototype.scrollIntoView=()=>{};w.scrollTo=()=>{};
 w.TaskSceneViewer={mount(element,model,options){
  const svg=doc.createElement('svg');element.append(svg);
  let camera=options.savedCamera||{yaw:.6,pitch:.4};
  const viewer={view:'neutral',setView(view){this.view=view;},getState:()=>camera,
   move(yaw,pitch){camera={yaw,pitch};options.onChange?.(camera);},destroy(){svg.remove();}};
  mounts.push(viewer);return viewer;
 }};
 for(const [key,value]of Object.entries(saved))w.localStorage.setItem(key,value);
 w.eval(fs.readFileSync(path.join(shared,'math-text.js'),'utf8'));
 w.eval(fs.readFileSync(runtime,'utf8'));
 const app=w.StereoTextbook.createApp(doc.getElementById('app'),{...clone(fixture),allowTestFixtures:true});
 return {w,doc,app,mounts,errors,close(){app.destroy();w.close();}};
}
function input(context,selector,value){const node=context.doc.querySelector(selector);assert(node,selector);node.value=value;node.dispatchEvent(new context.w.Event('input',{bubbles:true}));return node;}
function click(context,selector){const node=context.doc.querySelector(selector);assert(node,selector);node.click();return node;}
const tick=()=>new Promise(resolve=>setTimeout(resolve,5));
(async()=>{
 const oldKey='mathExamTextbook.v1:atanasyan-2024-10-11:fixture-exercise:r1';
 const newKey='mathExamTextbook.v1:'+bookId+':fixture-exercise:r1';
 const e=boot({[oldKey]:JSON.stringify({draft:'работа в другом учебнике'})});
 for(const query of ['1.1','№1.1','№ 1.1']){
  input(e,'#catalog-search',query);
  const buttons=e.doc.querySelectorAll('[data-catalog-ready] [data-lesson]');
  assert.equal(buttons.length,1,'exact decimal search '+query);
  assert.equal(buttons[0].dataset.lesson,'fixture-exercise');
 }
 input(e,'#catalog-search','1.10');
 assert.equal(e.doc.querySelector('[data-catalog-ready] [data-lesson]').dataset.lesson,'fixture-proof');
 input(e,'#catalog-search','11.1');
 assert.equal(e.doc.querySelector('[data-catalog-ready] [data-lesson]').dataset.lesson,'fixture-eleven');
 e.app.open('fixture-exercise');
 assert.equal(e.doc.querySelector('#final-answer').value,'','another book cannot overwrite this draft');
 const model=e.doc.querySelector('[data-main-model] svg');
 const answer=input(e,'#final-answer','Мои вычисления');e.mounts[0].move(1.1,.2);
 click(e,'[data-main-help]>summary');await tick();
 click(e,'[data-steps]+button');
 input(e,'#step-step-first','2');
 assert.strictEqual(e.doc.querySelector('#final-answer'),answer);
 assert.strictEqual(e.doc.querySelector('[data-main-model] svg'),model);
 assert.equal(answer.value,'Мои вычисления');
 assert.equal(e.doc.querySelectorAll('[data-step]').length,1,'previous steps remain visible');
 click(e,'[data-help=help-main]>button');
 assert(e.doc.querySelector('dialog'));
 click(e,'dialog>button');
 assert.equal(e.doc.querySelector('dialog'),null);
 assert.strictEqual(e.doc.querySelector('#final-answer'),answer);
 assert.equal(answer.value,'Мои вычисления','returning from theory preserves the current answer');
 const saved=e.w.localStorage.getItem(newKey);
 assert(saved,'course-specific progress was stored');
 assert.equal(JSON.parse(e.w.localStorage.getItem(oldKey)).draft,'работа в другом учебнике');
 assert.equal(e.errors.length,0);e.close();
 const restored=boot({[newKey]:saved});restored.app.open('fixture-exercise');
 assert.equal(restored.doc.querySelector('#final-answer').value,'Мои вычисления');
 assert.equal(restored.doc.querySelector('#step-step-first').value,'2');
 assert.deepEqual(JSON.parse(JSON.stringify(restored.mounts[0].getState())),{yaw:1.1,pitch:.2});
 assert.equal(restored.doc.querySelectorAll('[data-step]').length,1);
 assert.equal(restored.errors.length,0);restored.close();

 const bundlePath=path.join(course,'data/course.json');
 if(fs.existsSync(bundlePath)){
  const bundle=JSON.parse(fs.readFileSync(bundlePath,'utf8'));
  validateBundle(bundle,'course');
  const result=API.inspectBundle(bundle.catalog,bundle.lessons);
  assert.deepEqual(result.issues,[],'course must have no invalid source or ready records');
  assert.equal(result.coverage.available,bundle.lessons.filter(lesson=>lesson.status==='reviewed').length);
  console.log('MERZLYAK_BUNDLE_OK',JSON.stringify(result.coverage));
 }else console.log('MERZLYAK_BUNDLE_NOT_PRESENT: only isolated runtime/fixture checks ran');
 console.log('MERZLYAK_RUNTIME_OK: source offset, exact decimal search, review boundaries, separate book storage and retained work');
})().catch(error=>{console.error(error);process.exitCode=1;});
