'use strict';

// This finite audit supplements, and does not rewrite, the historical 669-row
// audit. Domain suites independently verify the new geometric constructions.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const data=require('../trainers/task19-visual-data.js'),audit=require('../trainers/task19-major-source-coverage.json');
const registry=require('../trainers/task19-source-coverage.json'),V=require('../trainers/task19-visual-models.js');
const hash=value=>crypto.createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');
const byId=new Map(data.cards.map(c=>[c.id,c])),added=new Set(audit.additions);
const expectedTruthDigest='a628725bbea705c30ea60866f19119845d7533a16ec10bfc830ca4b880c1b6a8';
const initialDigest='84525bbad9af4ec9dfd8f696442fb02c14033a1cab2d6b09e964d5ea2a16acbf';

test('exactly the approved 135 IDs and verdicts follow the unchanged 244-card baseline',()=>{
 assert.equal(data.cards.length,379);assert.equal(byId.size,379);assert.equal(audit.additions.length,135);assert.equal(added.size,135);
 assert.deepEqual(data.cards.slice(244).map(c=>c.id),audit.additions);
 assert.equal(hash(data.cards.slice(244).map(c=>[c.id,c.truth])),expectedTruthDigest,'approved identity and polarity');
 assert.equal(hash(data.cards.slice(0,244)),initialDigest,'all fields, aliases and order of all historical cards');
 assert.equal(audit.baseline.cardsSha256,initialDigest);assert.equal(audit.baseline.cards,244);
 const oldAliases=Object.fromEntries(Object.entries(data.aliases).filter(([id])=>!added.has(id)));
 assert.equal(hash(oldAliases),'7e7703f942411cd44ec9a921df7656e866b5e23c5acca52cdf4b7b2af9f5ae8a');
 const themes=new Set(data.cards.slice(0,244).map(c=>c.theme));
 for(const id of added){const c=byId.get(id);assert.deepEqual(c.aliases,[id]);assert.equal(data.aliases[id],id);assert(themes.has(c.theme),id+': existing topic filter');assert(c.text.trim()&&c.explanation.trim());assert.equal(typeof c.truth,'boolean');assert(c.hint.prompt&&c.hint.observe&&c.hint.preserve);assert(V.modelNames.includes(c.hint.model));assert.doesNotMatch(c.hint.prompt,/^(?:Это утверждение\s+)?(?:верно|неверно)[.!:]/i);}
 assert.equal(data.sourceCounts.unique,379);assert.equal(data.sourceCounts.majorSourceAdded,135);
});

test('all historical textbook references remain exact while four verified topics serve the expansion',()=>{
 const book=require('../trainers/task19-textbook-data.js'),metadata=require('../trainers/task19-textbook/source.json');
 const newTopics=['symmetry_axis','symmetry_center','intersecting_chords','tangent_secant'];
 const oldTopics=Object.fromEntries(Object.entries(book.topics).filter(([id])=>!newTopics.includes(id)));
 const oldCards=Object.fromEntries(Object.entries(book.cards).filter(([id])=>!added.has(id)));
 assert.equal(hash(oldTopics),'f5ec3b587bed467519448968d577e59543730a0f6a5d89c9fb7ae2be15656b29');
 assert.equal(hash(oldCards),'0cbab03b12502018e8011cd1062429006881f4cbc33e10fcf99214ff0e068185');
 assert.equal(hash(book.books),'c212b6aa8ca9279ddc1b92bb5f2e8d7e0c1d2c40ca2edcc26206c053a59fb0f0');
 assert.equal(Object.keys(book.cards).length,379);assert.equal(Object.keys(book.topics).length,58);
 assert.equal(metadata.coverage.cards,379);assert.equal(metadata.coverage.topics,58);
 for(const id of added){assert(book.cards[id]?.length,id+': textbook mapping');for(const t of book.cards[id])assert(book.topics[t],id+': known topic');}
 for(const id of newTopics)assert.equal(book.topics[id].passages.length,2,id+': two verified textbook passages');
});

test('2,151 historical sample, render and control outputs remain byte-for-byte identical',()=>{
 const evidence=[];
 for(const c of data.cards.slice(0,244)){
  const h=c.hint,controls=V.controlsFor(h.model,h.params),add=p=>{const r=V.render(h.model,p);evidence.push({id:c.id,sample:r.sample,svg:r.svg,readout:r.readout,controls:V.controlsFor(h.model,p)});};
  add(h.params);
  for(const ctl of controls)for(const x of [ctl.min,(ctl.min+ctl.max)/2,ctl.max])add(V.updateModel(h.model,h.params,ctl.key,x));
  for(const endpoint of ['min','max']){let p=h.params;for(const ctl of controls)p=V.updateModel(h.model,p,ctl.key,ctl[endpoint]);add(p);}
 }
 assert.equal(evidence.length,2151);assert.equal(audit.baseline.modelStates,2151);
 const expected='1c39f86b17d75ffb080c6dcedf0cf1b1edec24e483d2c5c0c1833269d4be8b7c';
 assert.equal(hash(evidence),expected);assert.equal(audit.baseline.modelOutputsSha256,expected);
 assert.equal(audit.baseline.modelNames.length,42);audit.baseline.modelNames.forEach(n=>assert(V.modelNames.includes(n),n));
});

test('all 681 finite observations are accounted for: 679 direct mappings and two excluded source-key conflicts',()=>{
 assert.equal(audit.assertions.length,681);assert.equal(new Set(audit.assertions.map(r=>r.id)).size,681);
 const sources=new Set(audit.sources.map(s=>s.id));assert.equal(sources.size,5);assert.equal(audit.sources.length,5);
 const groups={},quarantine=[];
 for(const row of audit.assertions){
  assert(sources.has(row.sourceId),row.sourceId);assert(row.location.trim()&&row.conditionReview.trim(),row.id);
  assert.equal(new URL(row.url).protocol,'https:');assert.equal(typeof row.truth,'boolean');assert.equal(row.officialBankBodyVerified,false);
  groups[row.sourceId]=(groups[row.sourceId]||0)+1;
  if(row.status==='quarantined'){quarantine.push(row);assert.deepEqual(row.cardIds,[]);assert(!byId.has(row.candidateId));assert.equal(row.publisherTruth,true);assert.equal(row.truth,false);}
  else{
   assert.equal(row.status,'covered');assert.equal(row.cardIds.length,1);assert(['exact-normalized','semantic-equivalent','reviewed-formulation'].includes(row.matchType));
   for(const id of row.cardIds){assert(byId.has(id),row.id+': canonical identity');assert.equal(byId.get(id).truth,row.truth,row.id+': same mathematical polarity');}
   if(row.candidateId){assert(added.has(row.candidateId));assert.deepEqual(row.cardIds,[row.candidateId],'a mere stronger or related old statement is not direct coverage');}
  }
 }
 assert.deepEqual(groups,{'lysenko-ivanov-2026-40-public-copy':140,'yashchenko-2027-36':108,'sdamgia-original-82':246,'repet-five-tables':175,'statgrad-20260415':12});
 assert.deepEqual(audit.counts.groups,groups);assert.equal(quarantine.length,2);
 assert.deepEqual(quarantine.map(r=>r.candidateId),['equidistant_sides_internal_bisector_ambiguous','disjoint_circles_at_least_two_common_tangents']);
 assert.equal(audit.counts.coveredObservations,679);assert.equal(audit.counts.quarantinedObservations,2);assert.equal(audit.counts.missingObservations,0);
 const mapped=new Set(audit.assertions.flatMap(r=>r.cardIds));added.forEach(id=>assert(mapped.has(id),id+': actual source occurrence'));
});

test('source limitations and the complete historical audit survive the extension',()=>{
 assert.equal(audit.officialBank.complete,false);assert.equal(audit.officialBank.questionBodiesRead,0);assert.equal(audit.officialBank.totalCurrentQuestions,null);
 assert.equal(audit.officialBank.navigatorUniqueIds,34);assert.equal(audit.officialBank.methodologyAssertionsRechecked,5);assert(audit.officialBank.status.trim());
 assert.equal(hash(fs.readFileSync(path.join(root,'trainers/task19-exam-source-coverage.json'),'utf8')),'1a04a025b04a6e45390adec24f3acc5b7f4f9993b13a955e8dd9adc6006c956e');
 assert.equal(audit.candidates.length,137);assert.deepEqual(audit.candidates.filter(c=>c.status==='add').map(c=>c.id),audit.additions);
 for(const c of audit.candidates){assert(c.sourceRefs.length&&c.sourceUrls.length&&c.conditionReview.trim(),c.id);if(c.status==='add'){const card=byId.get(c.id);assert.equal(c.truth,card.truth);assert.equal(c.model,card.hint.model);assert.equal(c.cardSemanticsSha256,hash({text:card.text,truth:card.truth}));}}
 const group=registry.sources.find(s=>s.id==='major-source-additions-20261116');assert(group);assert.equal(group.entries.length,135);
 assert.deepEqual(group.entries.map(e=>e.cardId),audit.additions);group.entries.forEach(e=>{assert.equal(e.text,byId.get(e.cardId).text);assert.equal(e.truth,byId.get(e.cardId).truth);assert.equal(e.officialBankBodyVerified,false);});
 const prior=structuredClone(registry);prior.sources=prior.sources.filter(s=>s.id!==group.id);prior.counts.uniqueCards=244;prior.counts.sourceEntries=477;delete prior.counts.majorSourceAdded;
 assert.equal(hash(JSON.stringify(prior,null,2)+'\n'),'d1e13543d7021bbf782938664b3ac56c5d7ba394087e0c162f81cf814e999472','all prior source mappings and metadata stay intact');
 // Public review handoffs contain source coordinates, never machine paths or a
 // full transcription of a commercial collection.
 const text=JSON.stringify(audit);assert.doesNotMatch(text,/\/workspace\/|\/home\/agent\/|sourceWordingExamples|"sourceText"/);
 for(const r of audit.assertions)assert(!Object.hasOwn(r,'text')&&!Object.hasOwn(r,'sourceText'));
});

test('each new model has a usable keyboard range and finite geometry across all exposed bounds',()=>{
 const finite=(v,label)=>{if(typeof v==='number')assert(Number.isFinite(v),label);else if(v&&typeof v==='object')Object.entries(v).forEach(([k,x])=>finite(x,label+'.'+k));};
 for(const id of added){const c=byId.get(id),h=c.hint,controls=V.controlsFor(h.model,h.params);assert(controls.length>0,id);
  for(const ctl of controls){assert(ctl.min<ctl.max&&Number.isFinite(ctl.min)&&Number.isFinite(ctl.max)&&ctl.step>0,id+': keyboard bounds');
   const outputs=[ctl.min,(ctl.min+ctl.max)/2,ctl.max].map(x=>V.render(h.model,V.updateModel(h.model,h.params,ctl.key,x)));
   for(const r of outputs){finite(r.sample.points,id);finite(r.sample.metrics,id);assert.doesNotMatch(r.svg,/NaN|Infinity|undefined/);assert(r.readout.length>0,id+': measured observations');}
   assert(new Set(outputs.map(r=>r.svg)).size>1,id+': '+ctl.key+' changes the drawing');
  }
 }
});
