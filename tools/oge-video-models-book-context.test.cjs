'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {receipt,geometryReceipt,pins,sourcePin,label,summaryHtml,hash,v3,verifiedV3Files,frozenWayfindingReceipt,frozenWayfindingHtml,wayfindingLabel}=require('./oge-video-models-book-context.cjs');
const {entries,assets,snippet}=require('./oge-video-models-preservation.cjs');
const ROOT=path.resolve(__dirname,'..');
const dom={count:1,tag:'DETAILS',id:'oge-video-models',closed:true,summaryCount:1,summaryHtml,visibleText:label};
const assetHashes=Object.fromEntries(assets.map(file=>['/'+file,hash(fs.readFileSync(path.join(ROOT,file)))]));
const fixture=file=>({file,raw:fs.readFileSync(path.join(ROOT,file),'utf8'),id:pins.pages[file].bookId,prefix:'',visible:'Native condition. '+label+' Native footer.',dom:{...dom},assetHashes:{...assetHashes}});
test('nine native-byte pins independently match the preserved89ee source and existing book routes',()=>{
 assert.equal(pins.baseCommit,'89ee66bfe5068f16364d61d091fcbf1a1cbd6287');
 assert.deepEqual(Object.keys(pins.pages).sort(),Object.values(entries).sort());
 const book=JSON.parse(fs.readFileSync(path.join(ROOT,'scripts/oge-book-edition/urls.json')));
 for(const [file,pin] of Object.entries(pins.pages)){
  assert.equal(hash(execFileSync('git',['show',pins.baseCommit+':'+file],{cwd:ROOT})),pin.sha256,file);
  assert.equal(entries[pin.task],file);
  assert.equal(book.find(row=>new URL(row.sourceUrl).pathname==='/'+file)?.id||null,pin.bookId,file);
 }
});
test('receipt accepts the exact middle-position closed summary on each covered source route',()=>{
 for(const file of Object.values(entries)){
  const x=fixture(file);if(!x.id){assert.throws(()=>receipt(x));continue;}
  const result=receipt(x);assert.equal(result.beforeText+result.label+result.afterText,x.visible);
  assert.equal(result.nativeSha256,sourcePin(file).sha256);assert.equal(result.sourceSha256,hash(x.raw));
 }
 const x=fixture(entries[11]);x.visible='🧭 '+x.visible;const result=receipt(x);
 assert.equal(result.offsetCodePoints,[...result.beforeText].length);assert.notEqual(result.offsetCodePoints,result.beforeText.length);
});
test('later teaching receipts remain limited to five committed pages and reject native mutations',()=>{
 const updates=require('./fixtures/oge-worked-steps-native-bytes.json');
 assert.equal(updates.task,'docs/tasks/OGE18_STEPS_PAN_20261110.md');
 assert.deepEqual(Object.keys(updates.pages).sort(),[entries[16],entries[17],entries[19],entries[24],entries[25]].sort());
 assert.equal(updates.pages[entries[24]].taskDoc,'docs/tasks/EXAM_AND_TEXTBOOK_LEARNING_20261114.md');
 assert.equal(updates.pages[entries[25]].taskDoc,'docs/tasks/GEOMETRY_SEVEN_CONSTRUCTIONS_20261118.md');
 for(const file of Object.keys(updates.pages)){
  const x=fixture(file), result=receipt(x);
  assert.equal(result.sourceBase,sourcePin(file).sourceCommit);
  for(const mutate of [s=>s+'\n',s=>s.replace('<title>','<title>Changed '),s=>s.replace(snippet(pins.pages[file].task),'')]){
   assert.throws(()=>receipt({...x,raw:mutate(x.raw)}),file+' preserves exact native bytes');
  }
 }
});
test('v3 corrections retain four exact historical public revisions and their separate live composition',()=>{
 assert.equal(v3.sourceCommit,'11449d27f9e6e1ffa208195b0d534e72f6a7f40b');
 assert.deepEqual(v3.publicSourceOverrides,[entries[11],entries[16],entries[24],entries[25]]);
 assert.equal(v3.manifestSha256,hash(fs.readFileSync(path.join(ROOT,v3.prefix.slice(1),'manifest.json'))));
 for(const [file,expected] of Object.entries(v3.sourceFiles)){
  const committed=execFileSync('git',['show',v3.sourceCommit+':'+file],{cwd:ROOT});
  assert.equal(hash(committed),expected,file+' immutable source provenance');
 }
 for(const file of v3.publicSourceOverrides){
  const x=fixture(file);assert.equal(receipt(x).sourceBase,sourcePin(file).sourceCommit);
  assert.throws(()=>receipt({...x,raw:x.raw+'\n'}));
 }
});
test('only the composed public task25 uses its exact new pin; frozen and parent receipts stay sealed',()=>{
 const file=entries[25],composed=v3.publicSourceCompositions[file];
 assert.deepEqual(Object.keys(v3.publicSourceCompositions),[file]);
 assert.equal(composed.sourceCommit,'7aec7b7fa32a7cfbb4b5367b06dd1de6699f430c');
 assert.deepEqual(composed.previousSourceCommits,[v3.sourceCommit,'d26f2e8936a7008ac792671533fcf66cbb21c4a4']);
 const raw=execFileSync('git',['show',composed.sourceCommit+':'+file],{cwd:ROOT,encoding:'utf8'});
 assert.equal(hash(raw),composed.sourceSha256,'complete committed source identity');
 assert.equal(raw,fixture(file).raw,'current source is the reviewed composition');
 const {restoreVideoModels,restoreGraphScale}=require('./oge-video-models-preservation.cjs');
 assert.equal(hash(restoreGraphScale(file,restoreVideoModels(file,raw))),composed.sha256);
 const x=fixture(file);
 for(const mutate of [s=>s+'\n',s=>s.replace('const tangent=Math.sqrt','const tangent=2*Math.sqrt'),s=>s.replace('BE — биссектриса, AD — медиана','BE — медиана, AD — биссектриса')]){
  const changed=mutate(raw);assert.notEqual(changed,raw);assert.throws(()=>receipt({...x,raw:changed}));
 }
 assert.notEqual(composed.sha256,v3.videoPages[file].nativeSha256,'frozen v3 retains its own original pin');
 for(const other of v3.publicSourceOverrides.filter(page=>page!==file))assert.equal(sourcePin(other).sourceCommit,v3.sourceCommit);
});
const frozenFixture=file=>{
 const x=fixture(file);x.prefix=v3.prefix;
 x.raw=fs.readFileSync(path.join(ROOT,v3.prefix.slice(1),file),'utf8');
 x.assetHashes=Object.fromEntries(assets.map(asset=>[v3.prefix+'/'+asset,hash(fs.readFileSync(path.join(ROOT,v3.prefix.slice(1),asset)))]));
 return x;
};
test('exact frozen-v3 receipts bind all eight video pages and exclude source or other editions',()=>{
 for(const file of Object.keys(v3.videoPages)){
  const x=frozenFixture(file),result=receipt(x);
  assert.equal(result.kind,'oge-video-models-closed-v3');
  assert.equal(result.manifestSha256,v3.manifestSha256);assert.equal(result.sourceBase,v3.sourceCommit);
  assert.equal(result.nativeSha256,v3.videoPages[file].nativeSha256);
  for(const prefix of ['', '/book/oge/2026-10-31/v1','/book/oge/2026-10-31/v2','/book/oge/2026-10-31/v3','/book/oge/2026-11-17/v3'])assert.throws(()=>receipt({...x,prefix}));
  for(const mutate of [y=>{y.raw+='\n';},y=>{y.dom.closed=false;},y=>{y.dom.count=2;},y=>{y.visible+=' '+label;},y=>{y.assetHashes[Object.keys(y.assetHashes)[0]]='0'.repeat(64);},y=>{y.id='03';}]){
   const changed=structuredClone(x);mutate(changed);assert.throws(()=>receipt(changed));
  }
 }
});
test('frozen wayfinding is a byte-bound two-link receipt; forged manifests and payloads fail',()=>{
 const x=frozenFixture(entries[16]),route='/'+x.file,finalPath=v3.prefix+route;
 const input={id:x.id,route,finalPath,raw:x.raw,dom:{count:1,html:frozenWayfindingHtml,visibleText:wayfindingLabel}};
 const bound=frozenWayfindingReceipt(input);
 assert.equal(bound.kind,'oge-frozen-return-v3');assert.equal(bound.servedHtmlSha256,hash(x.raw));
 for(const mutate of [y=>{y.dom.count=2;},y=>{y.dom.html=y.dom.html.replace(v3.prefix,'');},y=>{y.dom.visibleText+=' extra';},y=>{y.raw+=' changed';},y=>{y.finalPath=y.route;}]){
  const changed=structuredClone(input);mutate(changed);assert.throws(()=>frozenWayfindingReceipt(changed));
 }
 const read=fs.readFileSync,manifestPath=path.join(ROOT,v3.prefix.slice(1),'manifest.json');
 const targets=[manifestPath,path.join(ROOT,finalPath.slice(1)),path.join(ROOT,v3.prefix.slice(1),'trainers/oge-video-models.js'),path.join(ROOT,v3.prefix.slice(1),'edition-assets/bootstrap.js')];
 for(const target of targets){
  try{
   fs.readFileSync=(file,...args)=>{
    const raw=read(file,...args);if(String(file)!==target)return raw;
    return Buffer.isBuffer(raw)?Buffer.concat([raw,Buffer.from('\n')]):raw+'\n';
   };
   assert.throws(()=>receipt(x),'actual modified frozen payload or manifest is rejected');
  }finally{fs.readFileSync=read;}
 }
 const boundFiles=verifiedV3Files({id:x.id,route,finalPath});
 assert.equal(boundFiles.resourceHashes[finalPath],hash(x.raw));
});
test('only the existing task-13 redirect may use its exact frozen series target',()=>{
 const route='/trainers/oge-task13-inequalities.html',finalPath=v3.prefix+'/trainers/oge13-inequalities-series.html';
 const bound=verifiedV3Files({id:'56',route,finalPath});
 assert(bound.resourceHashes[v3.prefix+route]);assert(bound.resourceHashes[finalPath]);
 for(const change of [{id:'55'},{route:'/trainers/oge13-inequalities-series.html'},{finalPath:v3.prefix+route},{finalPath:finalPath+'changed'}])
  assert.throws(()=>verifiedV3Files({id:'56',route,finalPath,...change}));
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
