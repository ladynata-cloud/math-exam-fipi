'use strict';
// Isolated previous-release fixture for unchanged historical coverage gates.
// This never modifies source records, the published bundle or review flags.
const assert=require('node:assert/strict');
const ids=new Set(require('./polyhedra-selfcheck-manifest.json').cards);
function previousCourse(course,sourceIndex){
 const copy=structuredClone(course),seen=new Set();
 const originals=new Map(sourceIndex.entries.filter(e=>e.id.startsWith('source-selfcheck-3-')).map(e=>[e.source.exercise,e]));
 assert.equal(originals.size,14,'fourteen original chapter III source positions');
 copy.lessons=copy.lessons.filter(card=>!ids.has(card.id));
 copy.catalog.entries=copy.catalog.entries.flatMap(entry=>{
  if(entry.source.collection!=='selfcheck'||entry.source.chapter!=='III. Многогранники')return [entry];
  const number=entry.source.exercise;if(seen.has(number))return [];seen.add(number);
  const original=originals.get(number);assert(original,'known original self-check '+number);
  return [{id:original.id,kind:original.kind,title:original.title,source:structuredClone(original.source),revision:1,status:'draft'}];
 });
 assert.equal(seen.size,14,'restore every original draft source row');
 return copy;
}
module.exports={ids,previousCourse};
