'use strict';
// Hash-pinned published 485-card fixture. Projection serves historical tests
// only; authored records and product runtime are never modified by this helper.
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const published=require('./additional294-baseline.json');
const parts={'294':[null],'295':['а','б','в','г'],'296':[null],'297':['а','б','в'],'298':[null]};
const ids=new Set(['ex-main-0294','ex-main-0295-a','ex-main-0295-b','ex-main-0295-c','ex-main-0295-d','ex-main-0296','ex-main-0297-a','ex-main-0297-b','ex-main-0297-c','ex-main-0298']);
const numbers=new Set(Object.keys(parts));
const canon=x=>Array.isArray(x)?x.map(canon):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canon(x[k])])):x;
const sha=x=>crypto.createHash('sha256').update(JSON.stringify(canon(x))).digest('hex');
const target=entry=>entry.source.collection==='main'&&numbers.has(entry.source.exercise);
function previousIndex(sourceIndex){
 const copy=structuredClone(sourceIndex),entries=copy.entries.filter(target);
 assert.equal(entries.length,5,'five original additional-prism source positions');
 for(const entry of entries){
  const n=entry.source.exercise,page=n==='298'?87:86;
  assert.equal(entry.id,'source-main-'+n.padStart(4,'0'));
  assert.deepEqual(entry.source.printedPages,[page]);assert.deepEqual(entry.source.pdfPages,[page+2]);
  assert.deepEqual(entry.sourceSubparts,parts[n].filter(x=>x!==null),'actual printed subparts');
  if(Object.hasOwn(entry,'requiredParts'))assert.deepEqual(entry.requiredParts,parts[n]);
  delete entry.requiredParts;
 }
 assert.equal(sha(copy),published.sourceIndexSHA256,'exact source index before additional 294–298');
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
 assert.equal(seen.size,5);assert.equal(copy.lessons.length,485);
 assert.equal(sha(copy),published.canonicalBundleSHA256,'complete prior 485-card course, including every review');
 return copy;
}
function previousRegistry(registry){
 const copy={...structuredClone(registry),...structuredClone(published.registryMetadata)};
 copy.cards=copy.cards.filter(card=>!ids.has(card.id));copy.batches=copy.batches.slice(0,published.reviewBatches);
 assert.equal(copy.cards.length,485);assert.equal(copy.batches.length,24);
 assert.equal(sha(copy),published.registrySHA256,'complete prior review registry');return copy;
}
function previousCases(cases){
 const rows=[...cases].filter(([key])=>!ids.has(key.split('|')[0]));
 assert.equal(rows.length,1033);assert.equal(sha(rows),published.screenshotCasesSHA256,'all 1033 prior browser cases');return new Map(rows);
}
module.exports={ids,numbers,parts,target,published,canon,sha,previousIndex,previousCourse,previousRegistry,previousCases};
