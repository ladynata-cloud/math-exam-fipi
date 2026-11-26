'use strict';
// Preserve the exact published 662-card boundary before projecting this increment.
// All existing lessons, identities, review records and browser cases are hashed.
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const later=require('./additional414-baseline.cjs');
const published=require('./additional404-baseline.json'),ids=new Set(published.ids);
const canon=v=>Array.isArray(v)?v.map(canon):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canon(v[k])])):v;
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),sha=v=>hash(JSON.stringify(canon(v)));
const target=e=>e.source.collection==='main'&&Object.hasOwn(published.parts,e.source.exercise);
const originals=new Map(published.originalSources.map(e=>[e.source.exercise,e]));
function exact(actual,expected,label){assert.equal(new Set(actual).size,actual.length,label+': unique');assert.deepEqual([...actual].sort(),[...expected].sort(),label);}
function previousIndex(index){
 if(index.entries.some(e=>later.target(e)&&Object.hasOwn(e,"requiredParts")))index=later.previousIndex(index);
 const copy=structuredClone(index),entries=copy.entries.filter(target);assert.equal(entries.length,10,'ten original source exercises');
 const contracts=entries.filter(e=>Object.hasOwn(e,'requiredParts')).length;assert(contracts===0||contracts===10,'all ten contracts together');
 for(const e of entries){if(contracts)assert.deepEqual(e.requiredParts,published.parts[e.source.exercise],'exact Cyrillic source parts');delete e.requiredParts;assert.deepEqual(e,originals.get(e.source.exercise),'unchanged source metadata');}
 assert.equal(sha(copy),published.sourceIndexSHA256,'complete published source index');return copy;
}
function previousCourse(course,index){
 if(course.lessons.some(c=>later.ids.has(c.id))||course.catalog.entries.some(c=>later.ids.has(c.id))){course=later.previousCourse(course,index);index=later.previousIndex(index);}
 previousIndex(index);const added=course.lessons.filter(c=>ids.has(c.id)),catalog=course.catalog.entries.filter(e=>ids.has(e.id));
 if(!added.length&&!catalog.length){assert.equal(sha(course),published.canonicalBundleSHA256,'exact pre-increment course');return structuredClone(course);}
 exact(added.map(c=>c.id),ids,'all twelve additional cards');
 for(const c of added)assert.equal(sha(c),published.integratedHashes[c.id],'reviewed new content and flags: '+c.id);
 exact(course.catalog.entries.filter(target).map(e=>e.id),ids,'all twelve catalogue parts');
 const copy=structuredClone(course),seen=new Set();copy.lessons=copy.lessons.filter(c=>!ids.has(c.id));
 copy.catalog.entries=copy.catalog.entries.flatMap(e=>{
  if(!target(e))return[e];const card=added.find(c=>c.id===e.id);
  assert.deepEqual(e,Object.fromEntries(['id','revision','kind','title','status','source'].map(k=>[k,card[k]])),'catalogue matches card');
  const n=e.source.exercise;if(seen.has(n))return[];seen.add(n);const original=originals.get(n);
  return[{id:original.id,kind:original.kind,title:original.title,source:structuredClone(original.source),revision:1,status:'draft'}];
 });
 assert.equal(copy.lessons.length,662);assert.equal(copy.catalog.entries.length,published.catalogEntries);
 assert.equal(sha(copy),published.canonicalBundleSHA256,'every published lesson and catalogue flag preserved');return copy;
}
function previousRegistry(registry){
 if(registry.cards.some(c=>later.ids.has(c.id)))registry=later.previousRegistry(registry);
 const added=registry.cards.filter(c=>ids.has(c.id));if(!added.length){assert.equal(sha(registry),published.registrySHA256);return structuredClone(registry);}
 exact(added.map(c=>c.id),ids,'twelve review rows');assert.equal(registry.batches.length,published.reviewBatches+1);exact(registry.batches.at(-1).cardIds,ids,'one exact new batch');
 for(const row of added)assert.equal(row.sha256,published.contentHashes[row.id],'new content hash');
 const copy={...structuredClone(registry),...structuredClone(published.registryMetadata)};copy.cards=copy.cards.filter(c=>!ids.has(c.id));copy.batches=copy.batches.slice(0,published.reviewBatches);
 assert.equal(sha(copy),published.registrySHA256,'all prior review records preserved');return copy;
}
function previousCases(cases){
 if([...cases.keys()].some(k=>later.ids.has(k.split("|")[0])))cases=later.previousCases(cases);
 const all=[...cases],old=all.filter(([key])=>!ids.has(key.split('|')[0]));
 assert.equal(old.length,published.screenshotCases);assert.equal(sha(old),published.screenshotCasesSHA256,'all previous browser cases preserved');
 if(old.length!==all.length){assert.deepEqual(all.slice(0,old.length),old,'new cases append only');exact([...new Set(all.slice(old.length).map(([key])=>key.split('|')[0]))],ids,'every new card has cases');}
 return new Map(old);
}
function previousRawLessons(rows){
 if(rows.some(([name])=>later.ids.has(name.replace(/\.json$/,""))))rows=later.previousRawLessons(rows);
 const added=rows.filter(([name])=>ids.has(name.replace(/\.json$/,'')));if(added.length)exact(added.map(([name])=>name.slice(0,-5)),ids,'twelve new lesson files');
 const old=rows.filter(([name])=>!ids.has(name.replace(/\.json$/,''))).sort(([a],[b])=>a<b?-1:a>b?1:0);
 assert.equal(old.length,662);assert.equal(sha(old),published.rawLessonManifestSHA256,'all 662 raw lesson bytes');return old;
}
function previousLessonFiles(directory){return previousRawLessons(fs.readdirSync(directory).filter(n=>n.endsWith('.json')).sort().map(n=>[n,hash(fs.readFileSync(path.join(directory,n)))])).map(([n])=>n);}
module.exports={published,ids,target,canon,hash,sha,exact,previousIndex,previousCourse,previousRegistry,previousCases,previousRawLessons,previousLessonFiles};
