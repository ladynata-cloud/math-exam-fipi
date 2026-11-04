'use strict';
// Navigation uses the existing full-history server summary, never page views.
const test=require('node:test'),assert=require('node:assert/strict');
const route=require('../learning/route'),catalog=require('../learning/catalog');
const groups=route.geometryTrackGroups(catalog);
const summary=(id,outcome='hinted',completed=true,updatedAt='2026-10-16T10:00:00Z')=>{
 const item=catalog.get(id);
 return {trainerId:item.trainerId,contentId:item.contentId,completed,
  latest:{id:'synthetic-'+item.contentId,trainerId:item.trainerId,contentId:item.contentId,outcome,updatedAt}};
};
test('two journeys retain all source content and keep the third criterion separate',()=>{
 assert.equal(route.geometrySections.length,17);
 assert.equal(groups.workbook.length,103);
 assert.equal(new Set(groups.workbook).size,103);
 assert.equal(groups.proofs.length,15);
 assert(!groups.workbook.some(id=>id.includes('photo-proof-')));
 assert.equal(route.geometryProofStages.filter(stage=>!stage.optional).length,3);
 assert(route.geometryProofStages[1].items.includes('path:grade7-r-photo-proof-1'));
 assert(route.geometryProofStages[1].items.includes('path:grade7-r-photo-proof-3'));
 assert(!route.geometryProofStages[1].items.includes('path:grade7-r-photo-proof-2'));
 assert(route.geometryProofStages[2].items.includes('path:grade7-r-photo-proof-2'));
 for(const id of route.geometryProofStages[3].items)assert(!groups.proofs.includes(id));
 assert.deepEqual(groups.workbook.map(id=>catalog.get(id).section),groups.workbook.map(id=>catalog.get(id).section).sort((a,b)=>a-b));
});
test('a new learner receives the first small step; merely opening it grants no completion',()=>{
 let state=route.geometryJourney(groups.proofs,catalog,[]);
 assert.equal(state.next.id,groups.proofs[0]);assert.equal(state.completed,0);assert.equal(state.resume,false);
 state=route.geometryJourney(groups.proofs,catalog,[summary(groups.proofs[0],'started',false)]);
 assert.equal(state.next.id,groups.proofs[0]);assert.equal(state.resume,true);assert.equal(state.completed,0);
});
test('helped completion advances and older completion survives beyond the recent list',()=>{
 const state=route.geometryJourney(groups.workbook,catalog,[summary(groups.workbook[0],'hinted',true,'2025-01-01T00:00:00Z'),summary(groups.workbook[1],'together')]);
 assert.equal(state.completed,2);assert.equal(state.next.id,groups.workbook[2]);assert.equal(state.resume,false);
});
test('the most recent unfinished task is resumed even after an earlier completed variant',()=>{
 const state=route.geometryJourney(groups.proofs,catalog,[summary(groups.proofs[0],'started',true,'2026-10-15T10:00:00Z'),summary(groups.proofs[4],'started',false)]);
 assert.equal(state.next.id,groups.proofs[4]);assert.equal(state.completed,1);assert.equal(state.resume,true);
});
test('complete journeys finish without looping or counting unrelated content',()=>{
 const entries=groups.proofs.map(id=>summary(id));entries.push(summary(groups.workbook[0]));
 const state=route.geometryJourney(groups.proofs,catalog,entries);
 assert.equal(state.completed,groups.proofs.length);assert.equal(state.next,null);assert.equal(state.resume,false);
});
test('journey markup preserves both expandable routes and all workbook lesson buttons',()=>{
 const markup=route.geometryTracks(catalog,ids=>ids.map(id=>'<button data-route-item="'+id+'"></button>').join(''));
 assert.equal((markup.match(/data-geometry-track=/g)||[]).length,2);
 assert.equal((markup.match(/data-geometry-section=/g)||[]).length,17);
 assert.equal((markup.match(/data-geometry-next=/g)||[]).length,2);
 for(const section of route.geometrySections)assert(markup.includes(section.title));
 assert(markup.includes('в том числе с помощью'));
 assert(!markup.includes('Тема 1 · страницы'));
});
