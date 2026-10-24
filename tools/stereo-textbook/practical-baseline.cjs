'use strict';
// Exact published474-card fixture for historical assertions. This does not
// alter authored files, the current bundle, source contracts or review flags.
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const published=require('./polyhedra-practical-baseline.json');
const ids=new Set(Array.from({length:5},(_,i)=>'ex-main-'+String(i+271).padStart(4,'0')));
const numbers=new Set(['271','272','273','274','275']);
const canon=x=>Array.isArray(x)?x.map(canon):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canon(x[k])])):x;
const sha=x=>crypto.createHash('sha256').update(JSON.stringify(canon(x))).digest('hex');
function target(entry){return entry.source.collection==='main'&&numbers.has(entry.source.exercise);}
function previousIndex(sourceIndex){
 const copy=structuredClone(sourceIndex),entries=copy.entries.filter(target);
 assert.equal(entries.length,5,'five original practical source positions');
 for(const entry of entries){
  assert.equal(entry.id,'source-main-'+entry.source.exercise.padStart(4,'0'));
  assert.deepEqual(entry.source.printedPages,[84]);assert.deepEqual(entry.source.pdfPages,[86]);
  assert.deepEqual(entry.sourceSubparts,[],'no invented original practical subparts');
  if(Object.hasOwn(entry,'requiredParts'))assert.deepEqual(entry.requiredParts,[null]);
  delete entry.requiredParts;
 }
 assert.equal(sha(copy),published.sourceIndexSHA256,'exact source index before the five practical contracts');
 return copy;
}
function previousCourse(course,sourceIndex){
 const index=previousIndex(sourceIndex),originals=new Map(index.entries.filter(target).map(e=>[e.source.exercise,e]));
 const copy=structuredClone(course),seen=new Set();
 copy.lessons=copy.lessons.filter(card=>!ids.has(card.id));
 copy.catalog.entries=copy.catalog.entries.map(entry=>{
  if(!target(entry))return entry;
  const n=entry.source.exercise;assert(!seen.has(n),'one unsplit practical row '+n);seen.add(n);
  const original=originals.get(n);
  return {id:original.id,kind:original.kind,title:original.title,source:structuredClone(original.source),revision:1,status:'draft'};
 });
 assert.equal(seen.size,5);assert.equal(copy.lessons.length,474);
 assert.equal(sha(copy),published.canonicalBundleSHA256,'complete published474-card bundle, including every previous review');
 return copy;
}
function previousRegistry(registry){
 const copy={...structuredClone(registry),...structuredClone(published.registryMetadata)};
 copy.cards=copy.cards.filter(card=>!ids.has(card.id));
 copy.batches=copy.batches.slice(0,published.reviewBatches);
 assert.equal(copy.cards.length,474);assert.equal(copy.batches.length,22);
 assert.equal(sha(copy),published.registrySHA256,'complete prior review registry');
 return copy;
}
function previousCases(cases){
 const rows=[...cases].filter(([key])=>!ids.has(key.split('|')[0]));
 assert.equal(rows.length,917);assert.equal(sha(rows),published.screenshotCasesSHA256,'all917 prior browser cases preserved');
 return new Map(rows);
}
module.exports={ids,numbers,published,canon,sha,previousIndex,previousCourse,previousRegistry,previousCases};
