'use strict';
// Pure partition/evidence contract. No browser, network, filesystem or product state.
const assert=require('node:assert/strict');
const screenshotCases=require('./browser-cases.cjs');
const EXPECTED_COUNT=554; // Explicit reviewed release boundary; never inferred from data.
const WIDTHS=[320,1280],REPRESENTATIVE='atanasyan2024-main-001-a',SCHEMA=2;
const key=(...parts)=>JSON.stringify(parts);
function visibleLabelKeys(lesson,viewName){
 const model=lesson.visualization.model,view=model.views[viewName];assert(view,lesson.id+' known authored view '+viewName);
 let baseNames=model.labelNames||[...new Set([...(model.edges||[]).flat(),...(model.faces||[]).flat(),...(model.neutralPoints||[])])];
 if(!baseNames.length&&!model.labelNames)baseNames=Object.keys(model.points);
 return [...new Set([...baseNames,...(view.segments||[]).flat(),...(view.polygon||[]),...(view.points||[])])].filter(name=>!name.startsWith('_')||model.labels?.[name]).sort();
}
function shardSettings(env){
 const supplied=['TEXTBOOK_SHARD_COUNT','TEXTBOOK_SHARD_INDEX'].filter(name=>env[name]!==undefined);
 assert(supplied.length===0||supplied.length===2,'Set both shard count and index');
 const integer=(value,name)=>{assert(/^(0|[1-9]\d*)$/.test(value),name+' must be an integer');return Number(value);};
 const count=supplied.length?integer(env.TEXTBOOK_SHARD_COUNT,'shard count'):1,index=supplied.length?integer(env.TEXTBOOK_SHARD_INDEX,'shard index'):0;
 assert(Number.isSafeInteger(count)&&count>=1&&count<=64,'shard count 1..64');assert(Number.isSafeInteger(index)&&index>=0&&index<count,'shard index in range');return {count,index};
}
function exact(actual,expected,label){assert.equal(new Set(actual).size,actual.length,label+' no duplicates');assert.deepEqual([...actual].sort(),[...expected].sort(),label+' exact coverage');}
function modalInfo(lesson,byId){
 const special=lesson.id===REPRESENTATIVE;
 const step=special?lesson.steps.find(s=>s.justifications.some(j=>j.theoryId==='atanasyan2024-theory-003-line-point')):lesson.steps.find(s=>s.justifications.some(j=>j.theoryId&&byId.has(j.theoryId)));
 if(!step)return null;
 const id=special?'atanasyan2024-theory-003-line-point':step.justifications.find(j=>j.theoryId&&byId.has(j.theoryId)).theoryId;
 const theory=byId.get(id);assert(theory,'known modal theory');
 const nestedStep=special?theory.steps.find(s=>s.justifications.some(j=>j.theoryId&&j.theoryId!==id&&byId.has(j.theoryId))):null;
 if(special)assert(nestedStep,'representative nested theory');
 return {id,nestedId:nestedStep?.justifications.find(j=>j.theoryId&&j.theoryId!==id&&byId.has(j.theoryId)).theoryId,nestedView:nestedStep?.view||'neutral'};
}
function makePlan(lessons,options={}){
 const {count=1,index=0}=options;assert(Number.isSafeInteger(count)&&count>=1&&count<=64);assert(Number.isSafeInteger(index)&&index>=0&&index<count);
 assert(Array.isArray(lessons)&&lessons.length>=count,'at least one card per shard');
 const byId=new Map(lessons.map(l=>[l.id,l]));assert.equal(byId.size,lessons.length,'unique authored IDs');
 const sorted=[...byId.keys()].sort(),assignedIds=sorted.filter((_,position)=>position%count===index),assignedSet=new Set(assignedIds);
 const assigned=lessons.filter(l=>assignedSet.has(l.id));
 for(const [caseKey,name] of screenshotCases){const [id,stage]=caseKey.split('|'),lesson=byId.get(id);assert(lesson,'known screenshot lesson '+caseKey);assert(/^[a-z0-9-]+$/.test(name),'safe screenshot filename');if(stage.startsWith('step-'))assert(lesson.steps.some(step=>step.id===stage),'known screenshot step '+caseKey);if(stage.startsWith('help:')){const found=items=>items.some(item=>item.id===stage.slice(5)||found(item.children||[]));assert(found(lesson.help),'known screenshot help '+caseKey);}assert(stage==='condition'||stage==='nested-theory'||stage.startsWith('step-')||stage.startsWith('help:'),'known screenshot stage');}
 const cards=[],labels=[],screenshots=[],expansionScreenshots=[],expansions=[];
 for(const width of WIDTHS)for(const lesson of assigned){
  const info=modalInfo(lesson,byId);cards.push({id:lesson.id,width,steps:lesson.steps.length,modalChecked:!!info,reload:true,source:lesson.source});
  const add=(id,stage,view)=>labels.push({ownerId:lesson.id,id,viewport:width,stage,view});
  add(lesson.id,'condition','neutral');
  function helps(items){for(const item of items){add(lesson.id,'help:'+item.id,item.view||'neutral');helps(item.children||[]);}}helps(lesson.help);
  for(const step of lesson.steps)add(lesson.id,step.id,step.view||'neutral');
  if(info)add(info.id,'theory-modal','neutral');
  if(lesson.id===REPRESENTATIVE){
   assert(info?.nestedId);add(info.nestedId,'nested-theory','neutral');
   for(const scope of ['main','theory']){
    const id=scope==='main'?lesson.id:info.id,view=scope==='main'?'neutral':info.nestedView;
    expansionScreenshots.push({id,width,scope,file:scope+'-expanded-'+width+'.png'});
    for(const closeBy of ['button','Escape']){add(id,scope+'-expanded-'+closeBy,view);expansions.push({id,width,scope,closeBy});}
   }
  }
 }
 for(const [caseKey,name] of screenshotCases){const [id,stage]=caseKey.split('|');if(assignedSet.has(id))for(const width of WIDTHS)screenshots.push({id,stage,width,file:name+'-'+width+'.png'});}
 const twoTabs=index===0?[true,false]:[];
 return {count,index,lessons,byId,assigned,assignedIds,cards,labels,screenshots,expansionScreenshots,expansions,twoTabs,...options};
}
function validateShard(evidence,plan){
 assert.equal(evidence.schemaVersion,SCHEMA,'evidence schema');assert.equal(evidence.completed,true,'completed browser evidence');assert(!evidence.failure,'no failure');assert.deepEqual(evidence.errors,[],'no browser errors');
 assert.equal(evidence.authoredCards,plan.lessons.length,'authored count');assert.deepEqual(evidence.widths,WIDTHS,'both exact widths');assert.deepEqual(evidence.shard,{count:plan.count,index:plan.index,assignedIds:plan.assignedIds},'exact shard assignment');
 for(const field of ['commit','authoredFileSha256','bundleFileSha256','separateAuthorBundle'])assert.equal(evidence[field],plan[field],field+' matches current checkout');
 assert(/^[a-f0-9]{64}$/.test(evidence.authoredFileSha256),'authored SHA256');assert(/^[a-f0-9]{64}$/.test(evidence.bundleFileSha256),'bundle SHA256');
 if(plan.count>1)assert(/^[a-f0-9]{40}$/.test(evidence.commit),'sharded run requires Git SHA');
 assert(evidence.runtimeCoverage&&evidence.runtimeCoverage.available>=plan.lessons.length,'runtime coverage');
 exact(evidence.cards.map(x=>key(x.id,x.width)),plan.cards.map(x=>key(x.id,x.width)),'card/width');
 for(const expected of plan.cards){const actual=evidence.cards.find(x=>x.id===expected.id&&x.width===expected.width);assert.deepEqual(actual,expected,'full completed card '+expected.id);}
 for(const field of ['screenshots','expansionScreenshots']){exact(evidence[field].map(x=>key(x.id,x.width,x.stage??x.scope)),plan[field].map(x=>key(x.id,x.width,x.stage??x.scope)),field);for(const expected of plan[field])assert.deepEqual(evidence[field].find(actual=>actual.id===expected.id&&actual.width===expected.width&&(actual.stage??actual.scope)===(expected.stage??expected.scope)),expected,field+' exact filename/identity');}
 exact(evidence.labels.map(x=>key(x.ownerId,x.id,x.viewport,x.stage)),plan.labels.map(x=>key(x.ownerId,x.id,x.viewport,x.stage)),'label states');
 const labelMap=new Map(plan.labels.map(x=>[key(x.ownerId,x.id,x.viewport,x.stage),x]));
 for(const row of evidence.labels){
  const expected=labelMap.get(key(row.ownerId,row.id,row.viewport,row.stage));assert.equal(row.view,expected.view,'exact displayed label view');assert.equal(row.finite,true,'finite SVG');assert(Number.isFinite(row.width)&&row.width>0&&Number.isFinite(row.height)&&row.height>0,'positive viewBox');
  const keys=visibleLabelKeys(plan.byId.get(row.id),row.view);assert.deepEqual(row.expectedLabels,keys,'expected label keys');exact(row.labels.map(x=>x.key),keys,'actual labels');assert.deepEqual(row.overlaps,[],'no overlap evidence');
  for(const label of row.labels){for(const field of ['x','y','width','height','pixels'])assert(Number.isFinite(label[field]),'finite label '+field);assert(label.pixels>=18&&label.width>0&&label.height>0,'readable label');assert(label.x>=-1&&label.y>=-1&&label.x+label.width<=row.width+1&&label.y+label.height<=row.height+1,'unclipped label');}
  for(let i=0;i<row.labels.length;i++)for(let j=i+1;j<row.labels.length;j++){const a=row.labels[i],b=row.labels[j];assert(!(Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>1&&Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>1),'no actual label intersection');}
 }
 exact(evidence.expansions.map(x=>key(x.id,x.width,x.scope,x.closeBy)),plan.expansions.map(x=>key(x.id,x.width,x.scope,x.closeBy)),'expansion returns');
 for(const row of evidence.expansions){assert.equal(row.restored,true,'completed expansion restoration');assert.equal(row.after.same,true,'same original SVG');for(const field of ['view','yaw','pitch','overflow'])assert.equal(row.after[field],row.saved[field],'restored '+field);for(const axis of ['x','y'])assert(Number.isFinite(row.saved[axis])&&Math.abs(row.after[axis]-row.saved[axis])<=1,'restored scroll');if(row.scope==='theory')assert(Number.isFinite(row.saved.dialogTop)&&Math.abs(row.after.dialogTop-row.saved.dialogTop)<=1,'restored dialog scroll');assert.equal(row.bounds.position,'fixed');assert.equal(row.bounds.overflow,'hidden');assert.equal(row.bounds.viewportWidth,row.width);for(const [field,wanted] of [['x',0],['y',0],['width',row.width],['height',row.bounds.viewportHeight]])assert(Number.isFinite(wanted)&&Math.abs(row.bounds[field]-wanted)<=1,'full viewport '+field);assert(row.bounds.viewportHeight>0);assert.equal(row.label.text,'Развернуть рисунок');assert(row.label.font>=18&&row.label.scrollWidth<=row.label.clientWidth+1);const b=row.label.button,t=row.label.label;assert(t.x>=b.x-1&&t.x+t.width<=b.x+b.width+1&&t.y>=b.y-1&&t.y+t.height<=b.y+b.height+1,'expand label unclipped');}
 exact(evidence.twoTabs.map(x=>x.storageEvent),plan.twoTabs,'two-tab cases');for(const row of evidence.twoTabs)assert.deepEqual(row,{storageEvent:row.storageEvent,unchangedBytes:true,oldDraftRecoverable:true,newDraftRestored:true},'complete two-tab proof');
 return true;
}
function combine(shards,lessons,options){
 assert.equal(shards.length,options.count,'all shard artifacts');exact(shards.map(x=>x.shard?.index),Array.from({length:options.count},(_,i)=>i),'all shard indices');
 const sorted=[...shards].sort((a,b)=>a.shard.index-b.shard.index);
 for(const evidence of sorted)validateShard(evidence,makePlan(lessons,{...options,index:evidence.shard.index}));
 const combined={...sorted[0],shard:undefined,shards:sorted.map(x=>({index:x.shard.index,count:x.shard.count,assignedIds:x.shard.assignedIds,commit:x.commit,authoredFileSha256:x.authoredFileSha256,bundleFileSha256:x.bundleFileSha256,completed:x.completed}))};
 for(const field of ['cards','labels','screenshots','expansionScreenshots','expansions','twoTabs','errors'])combined[field]=sorted.flatMap(x=>x[field]);
 for(const evidence of sorted)assert.deepEqual(evidence.runtimeCoverage,combined.runtimeCoverage,'identical full-course runtime coverage');
 // Recheck the exact union against the old single-run universe, including four
 // expanded shots, eight restores and both real-tab scenarios.
 validateShard({...combined,shard:{count:1,index:0,assignedIds:makePlan(lessons,{...options,count:1,index:0}).assignedIds}},makePlan(lessons,{...options,count:1,index:0}));
 return combined;
}
module.exports={EXPECTED_COUNT,SCHEMA,WIDTHS,REPRESENTATIVE,shardSettings,visibleLabelKeys,makePlan,validateShard,combine};
