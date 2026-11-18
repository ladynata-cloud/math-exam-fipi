'use strict';
// Narrow evidence receipt for one closed optional summary, never an oracle or
// a general visible-text filter. Original math fixtures and SVGs stay intact.
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const {restoreVideoModels,restoreGraphScale,assets}=require('./oge-video-models-preservation.cjs');
const pins=require('./fixtures/oge-video-models-native-bytes.json');
// Explicit later teaching revisions; original historical pins remain immutable.
const updates=require('./fixtures/oge-worked-steps-native-bytes.json');
const v3=require('./fixtures/oge-book-v3-context.json');
const ROOT=path.resolve(__dirname,'..');
const sourcePin=file=>({...pins.pages[file],sourceCommit:pins.baseCommit,...updates.pages[file],
 ...(v3.publicSourceOverrides.includes(file)?{sourceCommit:v3.sourceCommit,sha256:v3.videoPages[file].nativeSha256}:{}),
 ...(v3.publicSourceCompositions[file]||{})});
const label='Разобраться на модели',summaryHtml='<summary data-ovm-open="">'+label+'</summary>';
const hash=raw=>crypto.createHash('sha256').update(raw).digest('hex');
const wayfindingLabel='← Все темы ОГЭ Главная';
const frozenWayfindingHtml='<nav class="oge-wayfinding" aria-label="Навигация ОГЭ"><a href="'+v3.prefix+'/trainers/oge-course/">← Все темы ОГЭ</a><a href="'+v3.prefix+'/">Главная</a></nav>';
function verifiedV3Files({id,route,finalPath,files=[]}){
 const manifestRaw=fs.readFileSync(path.join(ROOT,v3.prefix.slice(1),'manifest.json'));
 assert.equal(hash(manifestRaw),v3.manifestSha256,'the complete immutable v3 manifest is independently pinned');
 const manifest=JSON.parse(manifestRaw);
 assert.equal(manifest.schema,1);assert.equal(manifest.edition,v3.edition);
 assert.equal(manifest.prefix,v3.prefix.slice(1)+'/');assert.equal(manifest.sourceBase,v3.sourceBase);
 // The single pre-existing task-13 redirect has an explicitly reviewed target.
 const servedRoute=id==='56'&&route==='/trainers/oge-task13-inequalities.html'?'/trainers/oge13-inequalities-series.html':route;
 assert.equal(finalPath,v3.prefix+servedRoute,'exact frozen route or the single reviewed task-13 redirect');
 const entries=manifest.entries.filter(row=>row.id===id);
 assert.equal(entries.length,1,'one exact book ID');
 assert.equal(entries[0].sourceUrl,'https://mathexam.space'+route);
 assert.equal(entries[0].frozenUrl,'https://mathexam.space'+v3.prefix+route);
 const resourceHashes={};
 for(const file of new Set([route,servedRoute,'/edition-assets/bootstrap.js','/edition-assets/edition.css',...files])){
  assert(typeof file==='string'&&file.startsWith('/')&&!file.split('/').includes('..'),'bounded canonical resource');
  const target=v3.prefix+file,rows=manifest.files.filter(row=>row.path===target.slice(1));
  assert.equal(rows.length,1,'one frozen payload in the pinned manifest');
  const raw=fs.readFileSync(path.join(ROOT,target.slice(1)));
  assert.equal(raw.length,rows[0].bytes);assert.equal(hash(raw),rows[0].sha256,'actual frozen bytes match the manifest');
  const expected=v3.sourceFiles[file.slice(1)];
  if(expected){
   const sources=manifest.sourceFiles.filter(row=>row.path===file.slice(1));
   assert.equal(sources.length,1);assert.equal(sources[0].sha256,expected,'frozen payload comes from the exact reviewed source');
  }
  resourceHashes[target]=rows[0].sha256;
 }
 return {manifestSha256:v3.manifestSha256,resourceHashes};
}
function frozenWayfindingReceipt({id,route,finalPath,raw,dom}){
 const bound=verifiedV3Files({id,route,finalPath,files:['/assets/oge-wayfinding.css','/assets/oge-wayfinding.js']});
 assert.equal(hash(raw),bound.resourceHashes[finalPath]);
 assert.deepEqual(dom,{count:1,html:frozenWayfindingHtml,visibleText:wayfindingLabel},'exact two-link frozen return bar');
 assert.equal(String(raw).split(frozenWayfindingHtml).length,2,'one exact source-bound frozen return bar');
 return {kind:'oge-frozen-return-v3',visibleText:wayfindingLabel,servedHtmlSha256:hash(raw),manifestSha256:bound.manifestSha256};
}
function receipt({file,raw,id,prefix,visible,dom,assetHashes}){
 assert(prefix===''||prefix===v3.prefix,'only public source or this exact reviewed v3');
 const frozen=prefix===v3.prefix,reviewed=frozen?v3.videoPages[file]:sourcePin(file);
 assert(reviewed&&reviewed.bookId&&reviewed.bookId===id,'exact reviewed book/source route');
 const pin=frozen?{...reviewed,sourceCommit:v3.sourceCommit,sha256:reviewed.nativeSha256}:reviewed;
 let bound;
 if(frozen){
  bound=verifiedV3Files({id,route:'/'+file,finalPath:prefix+'/'+file,files:assets.map(file=>'/'+file)});
  assert.equal(hash(raw),bound.resourceHashes[prefix+'/'+file],'exact immutable frozen HTML');
 }else{
  const native=restoreVideoModels(file,raw);assert.notEqual(native,String(raw),'the exact optional include block is required');
  assert.equal(hash(restoreGraphScale(file,native)),pin.sha256,'native HTML matches the reviewed pin after exact presentation inverses');
 }
 assert.deepEqual(dom,{count:1,tag:'DETAILS',id:'oge-video-models',closed:true,summaryCount:1,summaryHtml,visibleText:label},'one exact closed summary is the complete visible addon');
 assert.deepEqual(Object.keys(assetHashes).sort(),assets.map(file=>prefix+'/'+file).sort(),'exact four local addon assets');
 for(const [asset,value] of Object.entries(assetHashes)){
  assert.match(value,/^[a-f0-9]{64}$/);
  assert.equal(value,frozen?bound.resourceHashes[asset]:hash(fs.readFileSync(path.join(ROOT,asset.slice(1)))),'actual model resource bytes');
 }
 const offset=visible.indexOf(label);assert(offset>=0&&visible.indexOf(label,offset+label.length)===-1,'one unique visible summary');
 const beforeText=visible.slice(0,offset),afterText=visible.slice(offset+label.length);
 assert((!beforeText||beforeText.endsWith(' '))&&(!afterText||afterText.startsWith(' ')),'summary occupies a bounded text segment');
 return {kind:frozen?'oge-video-models-closed-v3':'oge-video-models-closed-v1',route:'/'+file,bookId:id,task:pin.task,sourceBase:pin.sourceCommit,
  sourceSha256:hash(raw),nativeSha256:pin.sha256,closed:true,summaryHtml,label,offsetCodePoints:[...beforeText].length,beforeText,afterText,assets:assetHashes,...(frozen?{manifestSha256:bound.manifestSha256}:{})};
}
function geometryReceipt(context,rows,findings){
 const preview=pins.closedPreview,expected=preview.tasks.includes(context.task)?1:0;
 assert.equal(findings.length,expected,'only the reviewed closed L8 preview can accompany native geometry');
 return findings.map(item=>{
  assert(Number.isInteger(item.index)&&item.index>=0&&item.index<rows.length);
  assert.deepEqual({...item,index:0},{index:0,selector:preview.selector,lesson:preview.lesson,stage:preview.stage,closed:true,hidden:true},'exact closed preview ownership');
  assert.equal(hash(rows[item.index].svg),preview.svgSha256,'exact reviewed L8 preview geometry');
  return {...item,svgSha256:preview.svgSha256};
 });
}
module.exports={receipt,geometryReceipt,pins,sourcePin,label,summaryHtml,hash,v3,verifiedV3Files,frozenWayfindingReceipt,frozenWayfindingHtml,wayfindingLabel};
