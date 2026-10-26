'use strict';
// Hash-pinned published 495-card fixture. This test-only projection restores
// the complete preceding release without changing authored or runtime records.
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const published=require('./additional299-baseline.json');
const parts=Object.fromEntries(Array.from({length:11},(_,i)=>[String(i+299),i+299===307?['а','б']:[null]]));
const ids=new Set(['ex-main-0299','ex-main-0300','ex-main-0301','ex-main-0302','ex-main-0303','ex-main-0304','ex-main-0305','ex-main-0306','ex-main-0307-a','ex-main-0307-b','ex-main-0308','ex-main-0309']);
const numbers=new Set(Object.keys(parts));
const canon=x=>Array.isArray(x)?x.map(canon):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canon(x[k])])):x;
const sha=x=>crypto.createHash('sha256').update(JSON.stringify(canon(x))).digest('hex');
const target=entry=>entry.source.collection==='main'&&numbers.has(entry.source.exercise);
function previousIndex(sourceIndex){
 const copy=structuredClone(sourceIndex),entries=copy.entries.filter(target);
 assert.equal(entries.length,11,'eleven original additional-pyramid source positions');
 for(const entry of entries){
  const n=entry.source.exercise;
  assert.equal(entry.id,'source-main-'+n.padStart(4,'0'));
  assert.deepEqual(entry.source.printedPages,[87]);assert.deepEqual(entry.source.pdfPages,[89]);
  assert.deepEqual(entry.sourceSubparts,parts[n].filter(x=>x!==null),'actual printed subparts');
  if(Object.hasOwn(entry,'requiredParts'))assert.deepEqual(entry.requiredParts,parts[n]);
  delete entry.requiredParts;
 }
 assert.equal(sha(copy),published.sourceIndexSHA256,'exact source index before additional 299–309');
 return copy;
}
function previousCourse(course,sourceIndex){
 const index=previousIndex(sourceIndex),originals=new Map(index.entries.filter(target).map(e=>[e.source.exercise,e]));
 const copy=structuredClone(course),seen=new Set(),entries=[];
 copy.lessons=copy.lessons.filter(card=>!ids.has(card.id));
 for(const entry of copy.catalog.entries){
  if(!target(entry)){entries.push(entry);continue;}
  const number=entry.source.exercise;if(seen.has(number))continue;seen.add(number);
  const old=originals.get(number);
  entries.push({id:old.id,kind:old.kind,title:old.title,source:structuredClone(old.source),revision:1,status:'draft'});
 }
 copy.catalog.entries=entries;
 assert.equal(seen.size,11);assert.equal(copy.lessons.length,495);
 assert.equal(sha(copy),published.canonicalBundleSHA256,'complete prior 495-card course, including every review');
 return copy;
}
function previousRegistry(registry){
 const copy={...structuredClone(registry),...structuredClone(published.registryMetadata)};
 copy.cards=copy.cards.filter(card=>!ids.has(card.id));copy.batches=copy.batches.slice(0,published.reviewBatches);
 assert.equal(copy.cards.length,495);assert.equal(copy.batches.length,25);
 assert.equal(sha(copy),published.registrySHA256,'complete prior review registry');return copy;
}
function previousCases(cases){
 const rows=[...cases].filter(([key])=>!ids.has(key.split('|')[0]));
 assert.equal(rows.length,1099);assert.equal(sha(rows),published.screenshotCasesSHA256,'all 1099 prior browser cases');return new Map(rows);
}
module.exports={ids,numbers,parts,target,published,canon,sha,previousIndex,previousCourse,previousRegistry,previousCases};
