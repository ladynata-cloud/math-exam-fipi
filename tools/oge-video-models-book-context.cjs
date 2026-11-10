'use strict';
// Narrow evidence receipt for one closed optional summary, never an oracle or
// a general visible-text filter. Original math fixtures and SVGs stay intact.
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const {restoreVideoModels,assets}=require('./oge-video-models-preservation.cjs');
const pins=require('./fixtures/oge-video-models-native-bytes.json');
// Explicit later teaching revisions; original historical pins remain immutable.
const updates=require('./fixtures/oge-worked-steps-native-bytes.json');
function sourcePin(file,nativeSha256){
 const pin=pins.pages[file];if(!pin)return null;
 const choices=[
  pin.currentSource&&{sourceCommit:pin.currentSource.commit,sha256:pin.currentSource.sha256},
  updates.pages[file],
  {sourceCommit:pins.baseCommit,sha256:pin.sha256},
 ].filter(Boolean);
 const selected=nativeSha256===undefined?choices[0]:choices.find(source=>source.sha256===nativeSha256);
 return selected?{...pin,...selected}:null;
}
const label='Разобраться на модели',summaryHtml='<summary data-ovm-open="">'+label+'</summary>';
const hash=raw=>crypto.createHash('sha256').update(raw).digest('hex');
function receipt({file,raw,id,prefix,visible,dom,assetHashes}){
 assert.equal(prefix,'');
 const native=restoreVideoModels(file,raw);assert.notEqual(native,String(raw),'the exact optional include block is required');
 const pin=sourcePin(file,hash(native));
 assert(pin&&pin.bookId&&pin.bookId===id,'every native HTML byte must match an exact reviewed book/source route');
 assert.deepEqual(dom,{count:1,tag:'DETAILS',id:'oge-video-models',closed:true,summaryCount:1,summaryHtml,visibleText:label},'one exact closed summary is the complete visible addon');
 assert.deepEqual(Object.keys(assetHashes).sort(),assets.map(file=>'/'+file).sort(),'exact four local addon assets');
 for(const value of Object.values(assetHashes))assert.match(value,/^[a-f0-9]{64}$/);
 const offset=visible.indexOf(label);assert(offset>=0&&visible.indexOf(label,offset+label.length)===-1,'one unique visible summary');
 const beforeText=visible.slice(0,offset),afterText=visible.slice(offset+label.length);
 assert((!beforeText||beforeText.endsWith(' '))&&(!afterText||afterText.startsWith(' ')),'summary occupies a bounded text segment');
 return {kind:'oge-video-models-closed-v1',route:'/'+file,bookId:id,task:pin.task,sourceBase:pin.sourceCommit,
  sourceSha256:hash(raw),nativeSha256:pin.sha256,closed:true,summaryHtml,label,offsetCodePoints:[...beforeText].length,beforeText,afterText,assets:assetHashes};
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
module.exports={receipt,geometryReceipt,pins,sourcePin,label,summaryHtml,hash};
