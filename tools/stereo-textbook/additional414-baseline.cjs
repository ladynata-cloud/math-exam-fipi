'use strict';
// Validate the entire increment before projecting to the exact published 674 cards.
// No unknown card, partial source contract, altered review or missing old byte is ignored.
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const published=require('./additional414-baseline.json'),ids=new Set(published.ids);
const canon=v=>Array.isArray(v)?v.map(canon):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canon(v[k])])):v;
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),sha=v=>hash(JSON.stringify(canon(v)));
const target=e=>e.source.collection==='main'&&Object.hasOwn(published.parts,e.source.exercise);
const originals=new Map(published.originalSources.map(e=>[e.source.exercise,e]));
function exact(actual,expected,label){assert.equal(new Set(actual).size,actual.length,label+': unique');assert.deepEqual([...actual].sort(),[...expected].sort(),label);}
function previousIndex(index){
 const copy=structuredClone(index),entries=copy.entries.filter(target);assert.equal(entries.length,8,'eight original source exercises');
 const contracts=entries.filter(e=>Object.hasOwn(e,'requiredParts')).length;assert(contracts===0||contracts===8,'all eight contracts together');
 for(const e of entries){if(contracts)assert.deepEqual(e.requiredParts,published.parts[e.source.exercise],'exact Cyrillic source parts');delete e.requiredParts;assert.deepEqual(e,originals.get(e.source.exercise),'unchanged source metadata');}
 assert.equal(sha(copy),published.sourceIndexSHA256,'complete published source index');return copy;
}
function previousCourse(course,index){
 previousIndex(index);const added=course.lessons.filter(c=>ids.has(c.id)),catalog=course.catalog.entries.filter(e=>ids.has(e.id));
 if(!added.length&&!catalog.length){assert.equal(sha(course),published.canonicalBundleSHA256,'exact pre-increment course');return structuredClone(course);}
 assert(index.entries.filter(target).every(e=>Object.hasOwn(e,'requiredParts')),'integrated additions require all eight source contracts');
 exact(added.map(c=>c.id),ids,'all fourteen additional cards');
 for(const c of added)assert.equal(sha(c),published.integratedHashes[c.id],'reviewed new content and flags: '+c.id);
 exact(course.catalog.entries.filter(target).map(e=>e.id),ids,'all fourteen catalogue parts');
 const copy=structuredClone(course),seen=new Set();copy.lessons=copy.lessons.filter(c=>!ids.has(c.id));
 copy.catalog.entries=copy.catalog.entries.flatMap(e=>{
  if(!target(e))return[e];const card=added.find(c=>c.id===e.id);
  assert.deepEqual(e,Object.fromEntries(['id','revision','kind','title','status','source'].map(k=>[k,card[k]])),'catalogue matches card');
  const n=e.source.exercise;if(seen.has(n))return[];seen.add(n);const original=originals.get(n);
  return[{id:original.id,kind:original.kind,title:original.title,source:structuredClone(original.source),revision:1,status:'draft'}];
 });
 assert.equal(copy.lessons.length,674);assert.equal(copy.catalog.entries.length,published.catalogEntries);
 assert.equal(sha(copy),published.canonicalBundleSHA256,'every published lesson and catalogue flag preserved');return copy;
}
function previousRegistry(registry){
 const added=registry.cards.filter(c=>ids.has(c.id));if(!added.length){assert.equal(sha(registry),published.registrySHA256);return structuredClone(registry);}
 exact(added.map(c=>c.id),ids,'fourteen review rows');assert.equal(registry.batches.length,published.reviewBatches+1);exact(registry.batches.at(-1).cardIds,ids,'one exact new batch');
 for(const row of added)assert.equal(row.sha256,published.contentHashes[row.id],'new content hash');
 const copy={...structuredClone(registry),...structuredClone(published.registryMetadata)};copy.cards=copy.cards.filter(c=>!ids.has(c.id));copy.batches=copy.batches.slice(0,published.reviewBatches);
 assert.equal(sha(copy),published.registrySHA256,'all prior review records preserved');return copy;
}
function previousCases(cases){
 const all=[...cases],old=all.filter(([key])=>!ids.has(key.split('|')[0]));
 assert.equal(old.length,published.screenshotCases);assert.equal(sha(old),published.screenshotCasesSHA256,'all previous browser cases preserved');
 if(old.length!==all.length){assert.deepEqual(all.slice(0,old.length),old,'new cases append only');exact([...new Set(all.slice(old.length).map(([key])=>key.split('|')[0]))],ids,'every new card has cases');}
 return new Map(old);
}
function previousRawLessons(rows){
 const added=rows.filter(([name])=>ids.has(name.replace(/\.json$/,'')));if(added.length)exact(added.map(([name])=>name.slice(0,-5)),ids,'fourteen new lesson files');
 const old=rows.filter(([name])=>!ids.has(name.replace(/\.json$/,''))).sort(([a],[b])=>a<b?-1:a>b?1:0);
 assert.equal(old.length,674);assert.equal(sha(old),published.rawLessonManifestSHA256,'all 674 raw lesson bytes');return old;
}
function previousLessonFiles(directory){return previousRawLessons(fs.readdirSync(directory).filter(n=>n.endsWith('.json')).sort().map(n=>[n,hash(fs.readFileSync(path.join(directory,n)))])).map(([n])=>n);}
function validateVisualReceipt(receipt,cards){
 const visual=receipt.visual,widths=[320,390,1280],content=cards.map(c=>{const copy=structuredClone(c);delete copy.review;delete copy.status;return copy;});
 assert.equal(receipt.authoredSHA256,sha(content),'written review binds current authored content');
 assert.equal(visual.verdict,'passed','completed visual review');assert.equal(visual.reviewedContentSHA256,receipt.authoredSHA256,'visual review binds the same current content');
 assert.deepEqual(visual.widths,widths,'three reviewed viewport widths');
 const names=widths.flatMap(w=>cards.flatMap(c=>['initial',...Object.keys(c.visualization.model.views)].map(v=>w+'-'+c.id+'-'+v+'.png')));
 assert.equal(visual.reviewedModelViews,names.length-widths.length*cards.length);assert.equal(visual.authorInitialFullPages,widths.length*cards.length);
 exact(visual.captureHashes.map(x=>x.file),names,'all full pages and model states have a reviewed capture hash');
 for(const record of visual.captureHashes)assert(/^[0-9a-f]{64}$/.test(record.sha256),'capture SHA-256');
 assert(/^[0-9a-f]{64}$/.test(visual.captureEvidenceSHA256),'source evidence SHA-256');
}
module.exports={published,ids,target,canon,hash,sha,exact,previousIndex,previousCourse,previousRegistry,previousCases,previousRawLessons,previousLessonFiles,validateVisualReceipt};
