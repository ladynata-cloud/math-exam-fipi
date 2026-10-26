'use strict';
// Hash-pinned published 507-card fixture. This test-only projection restores
// the complete preceding release without changing authored or runtime records.
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const published=require('./additional310-baseline.json');
const parts={'310':[null],'311':['а','б'],'312':[null],'313':[null],'314':[null]};
const ids=new Set(['ex-main-0310','ex-main-0311-a','ex-main-0311-b','ex-main-0312','ex-main-0313','ex-main-0314']);
const numbers=new Set(Object.keys(parts));
const canon=x=>Array.isArray(x)?x.map(canon):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canon(x[k])])):x;
const sha=x=>crypto.createHash('sha256').update(JSON.stringify(canon(x))).digest('hex');
const target=entry=>entry.source.collection==='main'&&numbers.has(entry.source.exercise);
function previousIndex(sourceIndex){
 const copy=structuredClone(sourceIndex),entries=copy.entries.filter(target);
 assert.equal(entries.length,5,'five original remaining-pyramid source positions');
 for(const entry of entries){
  const n=entry.source.exercise;
  assert.equal(entry.id,'source-main-'+n.padStart(4,'0'));
  assert.deepEqual(entry.source.printedPages,[88]);assert.deepEqual(entry.source.pdfPages,[90]);
  assert.deepEqual(entry.sourceSubparts,parts[n].filter(x=>x!==null),'actual printed subparts');
  if(Object.hasOwn(entry,'requiredParts'))assert.deepEqual(entry.requiredParts,parts[n]);
  delete entry.requiredParts;
 }
 assert.equal(sha(copy),published.sourceIndexSHA256,'exact source index before additional 310–314');
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
 assert.equal(seen.size,5);assert.equal(copy.lessons.length,507);
 assert.equal(sha(copy),published.canonicalBundleSHA256,'complete prior 507-card course, including every review');
 return copy;
}
function previousRegistry(registry){
 const copy={...structuredClone(registry),...structuredClone(published.registryMetadata)};
 copy.cards=copy.cards.filter(card=>!ids.has(card.id));copy.batches=copy.batches.slice(0,published.reviewBatches);
 assert.equal(copy.cards.length,507);assert.equal(copy.batches.length,26);
 assert.equal(sha(copy),published.registrySHA256,'complete prior review registry');return copy;
}
function previousCases(cases){
 const rows=[...cases].filter(([key])=>!ids.has(key.split('|')[0]));
 assert.equal(rows.length,1188);assert.equal(sha(rows),published.screenshotCasesSHA256,'all 1188 prior browser cases');return new Map(rows);
}
module.exports={ids,numbers,parts,target,published,canon,sha,previousIndex,previousCourse,previousRegistry,previousCases};
