'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {receipt,geometryReceipt,pins,label,summaryHtml,hash}=require('./oge-video-models-book-context.cjs');
const {entries,assets,snippet,restoreVideoModels}=require('./oge-video-models-preservation.cjs');
const ROOT=path.resolve(__dirname,'..');
const dom={count:1,tag:'DETAILS',id:'oge-video-models',closed:true,summaryCount:1,summaryHtml,visibleText:label};
const assetHashes=Object.fromEntries(assets.map(file=>['/'+file,hash(fs.readFileSync(path.join(ROOT,file)))]));
const fixture=file=>({file,raw:fs.readFileSync(path.join(ROOT,file),'utf8'),id:pins.pages[file].bookId,prefix:'',visible:'Native condition. '+label+' Native footer.',dom:{...dom},assetHashes:{...assetHashes}});
const CURRENT_SOURCE='aa5f27628d5c384e001df55334fc703e83e6f36e';
test('native-byte pins independently match the historical and exact current sources and existing book routes',()=>{
 assert.equal(pins.baseCommit,'89ee66bfe5068f16364d61d091fcbf1a1cbd6287');
 assert.deepEqual(Object.keys(pins.pages).sort(),Object.values(entries).sort());
 assert.deepEqual(Object.keys(pins.pages).filter(file=>pins.pages[file].currentSource),[entries[11],entries[16]]);
 const book=JSON.parse(fs.readFileSync(path.join(ROOT,'scripts/oge-book-edition/urls.json')));
 for(const [file,pin] of Object.entries(pins.pages)){
  assert.equal(hash(execFileSync('git',['show',pins.baseCommit+':'+file],{cwd:ROOT})),pin.sha256,file);
  if(pin.currentSource){
   assert.equal(pin.currentSource.commit,CURRENT_SOURCE);
   const candidate=execFileSync('git',['show',CURRENT_SOURCE+':'+file],{cwd:ROOT,encoding:'utf8'});
   assert.equal(hash(restoreVideoModels(file,candidate)),pin.currentSource.sha256,file);
   assert.notEqual(pin.currentSource.sha256,pin.sha256);
  }
  assert.equal(entries[pin.task],file);
  assert.equal(book.find(row=>new URL(row.sourceUrl).pathname==='/'+file)?.id||null,pin.bookId,file);
 }
});
test('receipt accepts the exact middle-position closed summary on each covered source route',()=>{
 for(const file of Object.values(entries)){
  const x=fixture(file);if(!x.id){assert.throws(()=>receipt(x));continue;}
  const result=receipt(x);assert.equal(result.beforeText+result.label+result.afterText,x.visible);
  const pin=pins.pages[file];
  assert.equal(result.nativeSha256,(pin.currentSource||pin).sha256);
  assert.equal(result.sourceBase,pin.currentSource?.commit||pins.baseCommit);
  assert.equal(result.sourceSha256,hash(x.raw));
 }
 const x=fixture(entries[11]);x.visible='🧭 '+x.visible;const result=receipt(x);
 assert.equal(result.offsetCodePoints,[...result.beforeText].length);assert.notEqual(result.offsetCodePoints,result.beforeText.length);
});
test('the earlier sources of the two changed trainers still produce historical receipts',()=>{
 for(const number of [11,16]){
  const x=fixture(entries[number]),pin=pins.pages[x.file];
  const baseline=execFileSync('git',['show',pins.baseCommit+':'+x.file],{cwd:ROOT,encoding:'utf8'});
  x.raw=baseline.replace('</head>',snippet(number)+'</head>');
  const result=receipt(x);
  assert.equal(result.sourceBase,pins.baseCommit);
  assert.equal(result.nativeSha256,pin.sha256);
  assert.equal(result.sourceSha256,hash(x.raw));
 }
});
test('one exact serialized L8 preview may be attested only inside the closed prediction container',()=>{
 const {JSDOM}=require('jsdom'),preview=pins.closedPreview;
 const lesson=require('../trainers/oge-video-geometry.js').find(x=>x.id===preview.lesson);
 const document=new JSDOM(lesson.preview({x:2}).svg),svg=document.window.document.querySelector('svg').outerHTML;document.window.close();
 assert.equal(hash(svg),preview.svgSha256,'pin matches independently reviewed default L8 preview');
 const rows=[{svg:'<svg><text>native unchanged</text></svg>'},{svg}];
 const finding={index:1,selector:preview.selector,lesson:preview.lesson,stage:preview.stage,closed:true,hidden:true};
 assert.equal(geometryReceipt({task:24},rows,[finding]).length,1);assert.equal(geometryReceipt({task:25},rows,[finding]).length,1);
 assert.deepEqual(geometryReceipt({task:11},[],[]),[]);
 for(const [key,value] of [['index',0],['selector','svg'],['lesson','other'],['stage','experiment'],['closed',false],['hidden',false]])assert.throws(()=>geometryReceipt({task:24},rows,[{...finding,[key]:value}]));
 assert.throws(()=>geometryReceipt({task:24},rows,[]));assert.throws(()=>geometryReceipt({task:24},rows,[finding,finding]));
 assert.throws(()=>geometryReceipt({task:11},rows,[finding]));assert.throws(()=>geometryReceipt({task:24},[rows[0],{svg:svg.replace('130 0','131 0')}],[finding]));
});
test('receipt rejects malformed DOM, wrong routes, absent/altered includes and native source edits',()=>{
 const x=fixture(entries[11]);
 const mutations=[
  x=>{x.prefix='/book/oge/2026-10-31/v1';},x=>{x.id='63';},x=>{x.file='other.html';},
  x=>{x.dom.closed=false;},x=>{x.dom.count=2;},x=>{x.dom.summaryCount=2;},x=>{x.dom.id='other';},x=>{x.dom.tag='DIV';},
  x=>{x.dom.summaryHtml=summaryHtml.replace('модели','изменённой модели');},x=>{x.dom.visibleText+=' hidden material';},
  x=>{x.visible=x.visible.replace(label,'');},x=>{x.visible+=' '+label;},x=>{x.visible=x.visible.replace(' '+label,'X'+label);},
  x=>{x.raw=x.raw.replace(snippet(11),'');},x=>{x.raw=x.raw.replace(snippet(11),snippet(11)+snippet(11));},
  x=>{x.raw=x.raw.replace(snippet(11),snippet(11).replace('defer','async'));},x=>{x.raw=x.raw.replace('</body>','<p>Changed condition</p></body>');},
  x=>{delete x.assetHashes[Object.keys(x.assetHashes)[0]];},x=>{x.assetHashes['/extra.js']='a'.repeat(64);},x=>{x.assetHashes[Object.keys(x.assetHashes)[0]]='bad';}
 ];
 for(const mutate of mutations){const changed=structuredClone(x);mutate(changed);assert.throws(()=>receipt(changed),String(mutate));}
});
test('independent Python receipt and unchanged-math-context negative probes pass',()=>{
 execFileSync('python3',[path.join(__dirname,'oge-video-models-book-context.test.py')],{cwd:ROOT,env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'},stdio:'pipe'});
});
