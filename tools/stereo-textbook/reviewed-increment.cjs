'use strict';

const assert=require('node:assert/strict');
const crypto=require('node:crypto');
function makeReviewedIncrement(data, later) {
  const ids=new Set(Object.keys(data.cards));
  function numberOf(entry) {
    const source = entry.source;
    const key = source.collection === 'main' ? source.exercise
      : source.collection === 'theory' ? 'theory-' + source.point : null;
    return key && Object.hasOwn(data.parts, key) ? key : null;
  }
  const canon=value=>Array.isArray(value)?value.map(canon):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,canon(value[k])])):value;
  const digest=value=>crypto.createHash('sha256').update(JSON.stringify(canon(value))).digest('hex');
  function indexBefore(index){
    if (later) index=later.indexBefore(index);
    const rows=index.entries.filter(entry=>numberOf(entry)&&Object.hasOwn(entry,'requiredParts'));
    if(!rows.length)return index;
    assert.equal(rows.length,Object.keys(data.parts).length);
    const result=structuredClone(index);
    for(const row of result.entries.filter(numberOf)){
      assert.deepEqual(row.requiredParts,data.parts[numberOf(row)]);
      delete row.requiredParts;
    }
    assert.equal(digest(result),data.before.index);
    return result;
  }
  function courseBefore(course,index){
    if (later) {course=later.courseBefore(course,index);index=later.indexBefore(index);}
    const added=course.lessons.filter(card=>ids.has(card.id));
    if(!added.length)return course;
    assert.equal(added.length,ids.size);
    indexBefore(index);
    const result=structuredClone(course), seen=new Set();
    for(const card of added)assert.equal(digest(card),data.cards[card.id].integrated);
    result.lessons=result.lessons.filter(c=>!ids.has(c.id));
    result.catalog.entries=result.catalog.entries.flatMap(entry=>{
      const n=numberOf(entry);if(!n)return [entry];
      const card=added.find(c=>c.id===entry.id);
      assert(card);assert.deepEqual(entry,Object.fromEntries(['id','revision','kind','title','status','source'].map(k=>[k,card[k]])));
      if(seen.has(n))return [];seen.add(n);return [structuredClone(data.previousCatalog[n])];
    });
    assert.equal(digest(result),data.before.course);
    return result;
  }
  function registryBefore(registry){
    if (later) registry=later.registryBefore(registry);
    const added=registry.cards.filter(row=>ids.has(row.id));
    if(!added.length)return registry;
    assert.equal(added.length,ids.size);
    for(const row of added)assert.equal(row.sha256,data.cards[row.id].authored);
    const result=structuredClone(registry);
    assert.deepEqual(result.batches.pop().cardIds,[...ids]);
    result.cards=result.cards.filter(row=>!ids.has(row.id));
    Object.assign(result,data.registryMetadata);
    assert.equal(digest(result),data.before.registry);
    return result;
  }
  function casesBefore(cases){
    if (later) cases=later.casesBefore(cases);
    const rows=[...cases],added=rows.filter(([key])=>ids.has(key.split('|')[0]));
    if(!added.length)return cases;
    assert.deepEqual(added,data.cases);
    const result=rows.filter(([key])=>!ids.has(key.split('|')[0]));
    assert.equal(digest(result),data.before.cases);
    return new Map(result);
  }
  function rawBefore(rows){
    if (later) rows=later.rawBefore(rows);
    const added=rows.filter(([name])=>ids.has(name.replace(/\.json$/,'')));
    if(!added.length)return rows;
    assert.equal(added.length,ids.size);
    for(const [name,hash] of added)assert.equal(hash,data.cards[name.slice(0,-5)].raw);
    return rows.filter(([name])=>!ids.has(name.replace(/\.json$/,'')));
  }
  return {ids,numberOf,indexBefore,courseBefore,registryBefore,casesBefore,rawBefore,digest};
}
module.exports = {makeReviewedIncrement};
