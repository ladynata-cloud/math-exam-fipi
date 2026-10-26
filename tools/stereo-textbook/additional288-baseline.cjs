'use strict';
// Exact reviewed 479-card PR330 fixture. Historical tests keep their own
// original boundaries; this projection never edits authored or runtime data.
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const published=require('./additional288-baseline.json');
const ids=new Set(Array.from({length:6},(_,i)=>'ex-main-'+String(i+288).padStart(4,'0')));
const numbers=new Set(Array.from({length:6},(_,i)=>String(i+288)));
const canon=x=>Array.isArray(x)?x.map(canon):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canon(x[k])])):x;
const sha=x=>crypto.createHash('sha256').update(JSON.stringify(canon(x))).digest('hex');
const target=entry=>entry.source.collection==='main'&&numbers.has(entry.source.exercise);
function previousIndex(sourceIndex){
 const copy=structuredClone(sourceIndex),entries=copy.entries.filter(target);
 assert.equal(entries.length,6,'six original additional-exercise source positions');
 for(const entry of entries){
  assert.equal(entry.id,'source-main-'+entry.source.exercise.padStart(4,'0'));
  assert.deepEqual(entry.source.printedPages,[86]);assert.deepEqual(entry.source.pdfPages,[88]);
  assert.deepEqual(entry.sourceSubparts,[],'no invented source subparts');
  if(Object.hasOwn(entry,'requiredParts'))assert.deepEqual(entry.requiredParts,[null]);
  delete entry.requiredParts;
 }
 assert.equal(sha(copy),published.sourceIndexSHA256,'exact source index before additional 288–293');
 return copy;
}
function previousCourse(course,sourceIndex){
 const index=previousIndex(sourceIndex),originals=new Map(index.entries.filter(target).map(e=>[e.source.exercise,e]));
 const copy=structuredClone(course),seen=new Set();
 copy.lessons=copy.lessons.filter(card=>!ids.has(card.id));
 copy.catalog.entries=copy.catalog.entries.map(entry=>{
  if(!target(entry))return entry;
  const number=entry.source.exercise;assert(!seen.has(number),'one unsplit row '+number);seen.add(number);
  const old=originals.get(number);
  return {id:old.id,kind:old.kind,title:old.title,source:structuredClone(old.source),revision:1,status:'draft'};
 });
 assert.equal(seen.size,6);assert.equal(copy.lessons.length,479);
 assert.equal(sha(copy),published.canonicalBundleSHA256,'complete prior 479-card course, including every review');
 return copy;
}
function previousRegistry(registry){
 const copy={...structuredClone(registry),...structuredClone(published.registryMetadata)};
 copy.cards=copy.cards.filter(card=>!ids.has(card.id));
 copy.batches=copy.batches.slice(0,published.reviewBatches);
 assert.equal(copy.cards.length,479);assert.equal(copy.batches.length,23);
 assert.equal(sha(copy),published.registrySHA256,'complete prior review registry');
 return copy;
}
function previousCases(cases){
 const rows=[...cases].filter(([key])=>!ids.has(key.split('|')[0]));
 assert.equal(rows.length,997);assert.equal(sha(rows),published.screenshotCasesSHA256,'all 997 prior browser cases');
 return new Map(rows);
}
module.exports={ids,numbers,target,published,canon,sha,previousIndex,previousCourse,previousRegistry,previousCases};
