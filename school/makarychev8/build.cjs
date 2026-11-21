'use strict';
const fs=require('node:fs'),path=require('node:path');
const read=f=>JSON.parse(fs.readFileSync(path.join(__dirname,f),'utf8'));
const sourceMap=read('source-map.json');
const lessons=['ch1.json','ch2.json','ch3.json','ch4-6.json'].flatMap(read).sort((a,b)=>a.order-b.order);
// Append only: old task indices are public deep links and saved-work locations.
lessons.find(l=>l.id==='p01').tasks.push(...read('exercises-1-24.json'));
lessons.find(l=>l.id==='p02').tasks.push(...read('exercises-25-54.json'));
lessons.find(l=>l.id==='p03').tasks.push(...read('exercises-55-74.json'));
lessons.find(l=>l.id==='p04').tasks.push(...read('exercises-75-109.json'));
lessons.find(l=>l.id==='p05').tasks.push(...read('exercises-110-133.json'));
lessons.find(l=>l.id==='p06').tasks.push(...read('exercises-134-149.json'));
lessons.find(l=>l.id==='p07').tasks.push(...read('exercises-150-180.json'));
lessons.find(l=>l.id==='p08').tasks.push(...read('exercises-181-200.json'));
lessons.find(l=>l.id==='p09').tasks.push(...read('exercises-201-211.json'));
const quadratics=lessons.find(l=>l.id==='p20');
quadratics.tasks.push(...read('exercises-510-530.json'));
quadratics.studyOrder=quadratics.tasks.map((_,i)=>i).sort((a,b)=>{
 const x=quadratics.tasks[a].source,y=quadratics.tasks[b].source;
 if(x.type!==y.type)return x.type==='textbook'?-1:1;
 if(x.type!=='textbook')return a-b;
 const num=s=>Number(/№\s*(\d+)/.exec(s.reference)[1]);
 if(num(x)!==num(y))return num(x)-num(y);
 // The request to identify monic equations follows all six coefficient triples.
 if(num(x)===511&&x.reference.includes(',')!==y.reference.includes(','))return x.reference.includes(',')?1:-1;
 return x.reference.localeCompare(y.reference,'ru',{numeric:true});
});
const formulaLesson=lessons.find(l=>l.id==='p21');
const formulaTasks=read('exercises-531-556.json');
formulaLesson.tasks.push(...formulaTasks);
const sourceSequence=formulaTasks.map(t=>t.id);
sourceSequence.splice(sourceSequence.indexOf('p21-source-532-b'),0,'p21-t01');
sourceSequence.splice(sourceSequence.indexOf('p21-source-533-d'),0,'p21-t02');
const sourceIndex=new Map(formulaLesson.tasks.map((t,i)=>[t.id,i]));
formulaLesson.studyOrder=[...sourceSequence.map(id=>sourceIndex.get(id)),...formulaLesson.tasks.map((t,i)=>t.source.type==='authored'?i:null).filter(i=>i!==null)];
const wordLesson=lessons.find(l=>l.id==='p22');
wordLesson.tasks.push(...read('exercises-557-577.json'));
wordLesson.studyOrder=wordLesson.tasks.map((_,i)=>i).sort((a,b)=>{
 const x=wordLesson.tasks[a].source,y=wordLesson.tasks[b].source;
 if(x.type!==y.type)return x.type==='textbook'?-1:1;
 if(x.type!=='textbook')return a-b;
 return Number(/№\s*(\d+)/.exec(x.reference)[1])-Number(/№\s*(\d+)/.exec(y.reference)[1])||a-b;
});
const vietaLesson=lessons.find(l=>l.id==='p23');
const vietaTasks=read('exercises-578-597.json');
vietaLesson.tasks.push(...vietaTasks);
const vietaOrder=vietaTasks.map(t=>t.id);
vietaOrder.splice(vietaOrder.indexOf('p23-source-581-b'),0,'p23-t01');
vietaOrder.splice(vietaOrder.indexOf('p23-source-582-b'),0,'p23-t02');
const vietaIndex=new Map(vietaLesson.tasks.map((t,i)=>[t.id,i]));
vietaLesson.studyOrder=[...vietaOrder.map(id=>vietaIndex.get(id)),...vietaLesson.tasks.map((t,i)=>t.source.type==='authored'?i:null).filter(i=>i!==null)];
const trinomialLesson=lessons.find(l=>l.id==='p24');
const trinomialTasks=read('exercises-598-616.json');
trinomialLesson.tasks.push(...trinomialTasks);
const trinomialOrder=trinomialTasks.map(t=>t.id);
trinomialOrder.splice(trinomialOrder.indexOf('p24-source-602-b'),0,'p24-t01');
trinomialOrder.splice(trinomialOrder.indexOf('p24-source-603-c'),0,'p24-t02');
const trinomialIndex=new Map(trinomialLesson.tasks.map((t,i)=>[t.id,i]));
trinomialLesson.studyOrder=[...trinomialOrder.map(id=>trinomialIndex.get(id)),...trinomialLesson.tasks.map((t,i)=>t.source.type==='authored'?i:null).filter(i=>i!==null)];
const factorLesson=lessons.find(l=>l.id==='p25');
const factorTasks=read('exercises-617-630.json');
factorLesson.tasks.push(...factorTasks);
const factorOrder=factorTasks.map(t=>t.id);
factorOrder.unshift('p25-t01');
factorOrder.splice(factorOrder.indexOf('p25-source-618-d'),0,'p25-t02');
const factorIndex=new Map(factorLesson.tasks.map((t,i)=>[t.id,i]));
factorLesson.studyOrder=[...factorOrder.map(id=>factorIndex.get(id)),...factorLesson.tasks.map((t,i)=>t.source.type==='authored'&&!t.source.adaptation?i:null).filter(i=>i!==null)];
const fractionalEquationLesson=lessons.find(l=>l.id==='p26');
const fractionalTasks=read('exercises-631-647.json');
fractionalEquationLesson.tasks.push(...fractionalTasks);
const fractionalOrder=['p26-t01','p26-t02',...fractionalTasks.map(t=>t.id)];
const fractionalIndex=new Map(fractionalEquationLesson.tasks.map((t,i)=>[t.id,i]));
fractionalEquationLesson.studyOrder=[...fractionalOrder.map(id=>fractionalIndex.get(id)),...fractionalEquationLesson.tasks.map((t,i)=>t.source.type==='authored'?i:null).filter(i=>i!==null)];
const rateLesson=lessons.find(l=>l.id==='p27');
const rateTasks=read('exercises-648-670.json');
rateLesson.tasks.push(...rateTasks);
const rateOrder=[rateTasks[0].id,'p27-t01','p27-t02',...rateTasks.slice(1).map(t=>t.id)];
const rateIndex=new Map(rateLesson.tasks.map((t,i)=>[t.id,i]));
rateLesson.studyOrder=[...rateOrder.map(id=>rateIndex.get(id)),...rateLesson.tasks.map((t,i)=>t.source.type==='authored'&&!t.source.adaptation?i:null).filter(i=>i!==null)];
const planeLesson=lessons.find(l=>l.id==='p28'),planeTasks=read('exercises-671-686.json');
planeLesson.tasks.push(...planeTasks);
const planeOrder=['p28-t01','p28-t02',...planeTasks.map(t=>t.id)],planeIndex=new Map(planeLesson.tasks.map((t,i)=>[t.id,i]));
planeLesson.studyOrder=[...planeOrder.map(id=>planeIndex.get(id)),...planeLesson.tasks.map((t,i)=>t.source.type==='authored'?i:null).filter(i=>i!==null)];
const systemsLesson=lessons.find(l=>l.id==='p29'),systemsTasks=read('exercises-687-695.json');
systemsLesson.tasks.push(...systemsTasks);
const systemsOrder=['p29-t01','p29-t02',...systemsTasks.map(t=>t.id)],systemsIndex=new Map(systemsLesson.tasks.map((t,i)=>[t.id,i]));
systemsLesson.studyOrder=[...systemsOrder.map(id=>systemsIndex.get(id)),...systemsLesson.tasks.map((t,i)=>t.source.type==='authored'?i:null).filter(i=>i!==null)];
const graphicalLesson=lessons.find(l=>l.id==='p30'),graphicalTasks=read('exercises-696-701.json');
graphicalLesson.tasks.push(...graphicalTasks);
const graphicalOrder=['p30-t01','p30-t02',...graphicalTasks.map(t=>t.id)],graphicalIndex=new Map(graphicalLesson.tasks.map((t,i)=>[t.id,i]));
graphicalLesson.studyOrder=[...graphicalOrder.map(id=>graphicalIndex.get(id)),...graphicalLesson.tasks.map((t,i)=>t.source.type==='authored'?i:null).filter(i=>i!==null)];
const solveLesson=lessons.find(l=>l.id==='p31'),solveTasks=read('exercises-702-718.json');
solveLesson.tasks.push(...solveTasks);
const solveOrder=['p31-t01',...solveTasks.map(t=>t.id)];
solveOrder.splice(solveOrder.indexOf('p31-source-703-a'),0,'p31-t02');
const solveIndex=new Map(solveLesson.tasks.map((t,i)=>[t.id,i]));
solveLesson.studyOrder=[...solveOrder.map(id=>solveIndex.get(id)),...solveLesson.tasks.map((t,i)=>t.source.type==='authored'?i:null).filter(i=>i!==null)];
const balanceLesson=lessons.find(l=>l.id==='p32'),balanceTasks=read('exercises-719-732.json');
balanceLesson.tasks.push(...balanceTasks);
const balanceOrder=['p32-t01',balanceTasks[0].id,'p32-t02',...balanceTasks.slice(1).map(t=>t.id)],balanceIndex=new Map(balanceLesson.tasks.map((t,i)=>[t.id,i]));
balanceLesson.studyOrder=[...balanceOrder.map(id=>balanceIndex.get(id)),...balanceLesson.tasks.map((t,i)=>t.source.type==='authored'&&!t.source.adaptation?i:null).filter(i=>i!==null)];
balanceLesson.sourceNotes={'p32-t02':'Проверка по условию на стр. 170: 40 курток и 25 костюмов дают всего 65 изделий и отношение 1,6. В ответах на стр. 310 указано 65 курток и 25 костюмов; это дало бы 90 изделий.'};
const parameterLesson=lessons.find(l=>l.id==='p33'),parameterTasks=read('exercises-733-742.json');
parameterLesson.tasks.push(...parameterTasks);
const parameterOrder=[...parameterTasks.map(t=>t.id)];
parameterOrder.splice(parameterOrder.indexOf('p33-source-738-b'),0,'p33-t01');
parameterOrder.push('p33-t02');
const parameterIndex=new Map(parameterLesson.tasks.map((t,i)=>[t.id,i]));
parameterLesson.studyOrder=[...parameterOrder.map(id=>parameterIndex.get(id)),...parameterLesson.tasks.map((t,i)=>t.source.type==='authored'?i:null).filter(i=>i!==null)];
const extraQuadratics=[...read('exercises-743-752.json'),...read('exercises-753-763.json'),...read('exercises-764-782.json'),...read('exercises-783-797.json'),...read('exercises-798-805.json'),...read('exercises-806-821.json'),...read('exercises-822-831.json'),...read('exercises-832-837.json')];
for(const lesson of lessons.filter(l=>l.order>=20&&l.order<=29)){
 const additional=extraQuadratics.filter(t=>t.id.startsWith(lesson.id+'-'));
 const start=lesson.tasks.length;lesson.tasks.push(...additional);
 const oldOrder=lesson.studyOrder||Array.from({length:start},(_,i)=>i);
 const authored=oldOrder.findIndex(i=>lesson.tasks[i].source.type==='authored');
 const order=[...oldOrder];order.splice(authored<0?order.length:authored,0,...additional.map((t,i)=>start+i));lesson.studyOrder=order;
}
// Preserve the original №842а/б tasks and saved addresses; insert the
// new source rows in book order ahead of the optional authored review.
const inequalitiesLesson=lessons.find(l=>l.id==='p34'),signTasks=[...read('exercises-838-845.json'),...read('exercises-846-859.json')];
inequalitiesLesson.tasks.push(...signTasks);
const originalSigns=['p34-t01','p34-t02'],signOrder=signTasks.map(t=>t.id);
signOrder.splice(signOrder.indexOf('p34-source-842-c'),0,...originalSigns);
const signIndices=new Map(inequalitiesLesson.tasks.map((t,i)=>[t.id,i]));
inequalitiesLesson.studyOrder=[...signOrder.map(id=>signIndices.get(id)),...inequalitiesLesson.tasks.map((t,i)=>t.source.type==='authored'?i:null).filter(i=>i!==null)];
const orderLesson=lessons.find(l=>l.id==='p35'),orderTasks=[...read('exercises-860-868.json'),...read('exercises-869-880.json')];
orderLesson.tasks.push(...orderTasks);
const ruleOrder=orderTasks.map(t=>t.id);
for(const [old,next] of [['p35-t01','p35-source-864-c-3'],['p35-t02','p35-source-864-d-3']])ruleOrder.splice(ruleOrder.indexOf(next),0,old);
const ruleIndices=new Map(orderLesson.tasks.map((t,i)=>[t.id,i]));
orderLesson.studyOrder=[...ruleOrder.map(id=>ruleIndices.get(id)),...orderLesson.tasks.map((t,i)=>t.source.type==='authored'?i:null).filter(i=>i!==null)];
const combinedLesson=lessons.find(l=>l.id==='p36'),combinedTasks=read('exercises-881-897.json');
combinedLesson.tasks.push(...combinedTasks);
const combinedOrder=combinedTasks.map(t=>t.id);
for(const [old,next]of [['p36-t01','p36-source-881-b'],['p36-t02','p36-source-882-b']])combinedOrder.splice(combinedOrder.indexOf(next),0,old);
const combinedIndices=new Map(combinedLesson.tasks.map((t,i)=>[t.id,i]));
combinedLesson.studyOrder=[...combinedOrder.map(id=>combinedIndices.get(id)),...combinedLesson.tasks.map((t,i)=>t.source.type==='authored'?i:null).filter(i=>i!==null)];
const setLesson=lessons.find(l=>l.id==='p37'),setTasks=read('exercises-898-910.json');setLesson.tasks.push(...setTasks);
const setOrder=setTasks.map(t=>t.id);
for(const [old,next]of [['p37-t01','p37-source-898-lists-union'],['p37-t02','p37-source-899-lists-union']])setOrder.splice(setOrder.indexOf(next),0,old);
const setIndices=new Map(setLesson.tasks.map((t,i)=>[t.id,i]));
setLesson.studyOrder=[...setOrder.map(id=>setIndices.get(id)),...setLesson.tasks.map((t,i)=>t.source.type==='authored'?i:null).filter(i=>i!==null)];
const axisLesson=lessons.find(l=>l.id==='p38'),axisTasks=read('exercises-911-931.json');axisLesson.tasks.push(...axisTasks);
const axisOrder=axisTasks.map(t=>t.id);
for(const [old,next]of [['p38-t01','p38-source-914-a'],['p38-t02','p38-source-915-b']])axisOrder.splice(axisOrder.indexOf(next),0,old);
const axisIndices=new Map(axisLesson.tasks.map((t,i)=>[t.id,i]));
axisLesson.studyOrder=[...axisOrder.map(id=>axisIndices.get(id)),...axisLesson.tasks.map((t,i)=>t.source.type==='authored'?i:null).filter(i=>i!==null)];
const rayLesson=lessons.find(l=>l.id==='p39'),rayTasks=[...read('exercises-932-955.json'),...read('exercises-956-972.json')];rayLesson.tasks.push(...rayTasks);
const rayOrder=rayTasks.map(t=>t.id);
for(const [old,next]of [['p39-t01','p39-source-935-c'],['p39-t02','p39-source-936-m']])rayOrder.splice(rayOrder.indexOf(next),0,old);
const rayIndices=new Map(rayLesson.tasks.map((t,i)=>[t.id,i]));
rayLesson.studyOrder=[...rayOrder.map(id=>rayIndices.get(id)),...rayLesson.tasks.map((t,i)=>t.source.type==='authored'?i:null).filter(i=>i!==null)];
const systemLesson=lessons.find(l=>l.id==='p40'),systemTasks=[...read('exercises-973-990.json'),...read('exercises-991-1003.json')];systemLesson.tasks.push(...systemTasks);
const systemOrder=systemTasks.map(t=>t.id);
systemOrder.splice(systemOrder.indexOf('p40-source-975-f'),0,'p40-t01');
systemOrder.splice(systemOrder.indexOf('p40-source-977-a'),0,'p40-t02');
const systemIndices=new Map(systemLesson.tasks.map((t,i)=>[t.id,i]));
systemLesson.studyOrder=[...systemOrder.map(id=>systemIndices.get(id)),...systemLesson.tasks.map((t,i)=>t.source.type==='authored'?i:null).filter(i=>i!==null)];
const proofLesson=lessons.find(l=>l.id==='p41'),proofTasks=read('exercises-1004-1013.json');proofLesson.tasks.push(...proofTasks);
const proofOrder=['p41-t01','p41-t02',...proofTasks.map(t=>t.id)],proofIndices=new Map(proofLesson.tasks.map((t,i)=>[t.id,i]));
proofLesson.studyOrder=[...proofOrder.map(id=>proofIndices.get(id)),...proofLesson.tasks.map((t,i)=>t.source.type==='authored'?i:null).filter(i=>i!==null)];
const chapterFourExtras=[...read('exercises-1014-1021.json'),...read('exercises-1022-1031.json'),...read('exercises-1032-1038.json'),...read('exercises-1039-1048.json'),...read('exercises-1049-1062.json')];
for(const lesson of lessons.filter(l=>l.order>=34&&l.order<=41)){
 const extra=chapterFourExtras.filter(t=>t.id.startsWith(lesson.id+'-'));
 if(!extra.length)continue;
 const start=lesson.tasks.length,order=[...lesson.studyOrder],authored=order.findIndex(i=>lesson.tasks[i].source.type==='authored');
 lesson.tasks.push(...extra);order.splice(authored<0?order.length:authored,0,...extra.map((_,i)=>start+i));lesson.studyOrder=order;
}
const functionLesson=lessons.find(l=>l.id==='p42'),functionTasks=read('exercises-1063-1068.json');
const previousOrder=functionLesson.tasks.map((_,i)=>i);
functionLesson.tasks.push(...functionTasks);
const orderedFunctionIds=['p42-t01',...functionTasks.filter(t=>t.id.startsWith('p42-source-1063-')||t.id.startsWith('p42-source-1064-')).map(t=>t.id),'p42-t02',...functionTasks.filter(t=>!t.id.startsWith('p42-source-1063-')&&!t.id.startsWith('p42-source-1064-')).map(t=>t.id)];
const functionIndices=new Map(functionLesson.tasks.map((t,i)=>[t.id,i]));
functionLesson.studyOrder=[...orderedFunctionIds.map(id=>functionIndices.get(id)),...previousOrder.filter(i=>i>1)];
const domainBlock=read('exercises-1069-1075.json');
const domainStart=functionLesson.tasks.length;
functionLesson.tasks.push(...domainBlock);
const beforeAuthored=functionLesson.studyOrder.indexOf(2);
functionLesson.studyOrder.splice(beforeAuthored,0,...domainBlock.map((_,i)=>domainStart+i));
const chartBlock=read('exercises-1076-1079.json');
const chartStart=functionLesson.tasks.length;
functionLesson.tasks.push(...chartBlock);
functionLesson.studyOrder.splice(functionLesson.studyOrder.indexOf(2),0,...chartBlock.map((_,i)=>chartStart+i));
const sourceAlternatives=chartBlock.filter(t=>t.source.correspondence==='author-alternative').map(t=>({number:t.source.originalNumber,lessonId:functionLesson.id,taskId:t.id,page:t.source.page}));
const propertiesBlock=read('exercises-1080-1087.json'),propertiesStart=functionLesson.tasks.length;
functionLesson.tasks.push(...propertiesBlock);
functionLesson.studyOrder.splice(functionLesson.studyOrder.indexOf(2),0,...propertiesBlock.map((_,i)=>propertiesStart+i));
const behaviorBlock=read('exercises-1088-1092.json'),behaviorStart=functionLesson.tasks.length;
functionLesson.tasks.push(...behaviorBlock);
functionLesson.studyOrder.splice(functionLesson.studyOrder.indexOf(2),0,...behaviorBlock.map((_,i)=>behaviorStart+i));
const tripBlock=read('exercises-1093-1096.json'),tripStart=functionLesson.tasks.length;
functionLesson.tasks.push(...tripBlock);
functionLesson.studyOrder.splice(functionLesson.studyOrder.indexOf(2),0,...tripBlock.map((_,i)=>tripStart+i));
const phasesLesson=lessons.find(l=>l.id==='p43'),phasesBlock=read('exercises-1097-1099.json');
const phasesOld=phasesLesson.tasks.map((_,i)=>i);
phasesLesson.tasks.push(...phasesBlock);
phasesLesson.studyOrder=[...phasesBlock.map((_,i)=>phasesOld.length+i),...phasesOld];
const curveBlock=read('exercises-1100-1102.json'),curveStart=phasesLesson.tasks.length;
phasesLesson.tasks.push(...curveBlock);
phasesLesson.studyOrder.splice(phasesLesson.studyOrder.indexOf(0),0,...curveBlock.map((_,i)=>curveStart+i));
// Supplementary §1 work keeps the existing topic and every original bookmark.
lessons.find(l=>l.id==='p01').tasks.push(...read('exercises-212-214.json'), ...read('exercises-215-220.json'));
for(const file of ['exercises-221-230.json','exercises-231-267.json']){
 for(const [topic,tasks] of Object.entries(read(file).topics))lessons.find(l=>l.id===topic).tasks.push(...tasks);
}
// Present completed textbook points in source order while preserving every bookmarked array index.
for (const lesson of lessons.filter(item=>item.order>=5&&item.order<=9)) {
 const indices=lesson.tasks.map((_,index)=>index);
 const ref=index=>lesson.tasks[index].source;
 lesson.studyOrder=indices.sort((a,b)=>{
  if(ref(a).type!==ref(b).type)return ref(a).type==='textbook'?-1:1;
  if(Boolean(ref(a).section)!==Boolean(ref(b).section))return ref(a).section?1:-1;
  if(lesson.order===8&&ref(a).type==='textbook'){
   const number=index=>Number(/№\s*(\d+)/.exec(ref(index).reference)[1]);
   const task=index=>lesson.tasks[index];
   const phase=index=>task(index).source.reference.includes('построение')&&[187,189].includes(number(index))?-1:0;
   return number(a)-number(b)||phase(a)-phase(b)||(task(a).bookOrder||0)-(task(b).bookOrder||0);
  }
  return ref(a).type==='textbook'?ref(a).reference.localeCompare(ref(b).reference,'ru',{numeric:true}):a-b;
 });
}
const rootsFiles=['roots-268-344.json','roots-345-436.json','roots-437-509.json','roots-review.json'];
for(const file of rootsFiles)for(const [id,tasks]of Object.entries(read(file).topics)){
 const lesson=lessons.find(l=>l.id===id);if(!lesson||lesson.order<10||lesson.order>19)throw Error('Invalid roots topic '+id);
 lesson.tasks.push(...tasks);
}
for(const [id,blocks]of Object.entries(read('roots-review.json').theory||{}))lessons.find(l=>l.id===id).theory.push(...blocks);
const rootNumbers=new Set(lessons.filter(l=>l.order>=10&&l.order<=19).flatMap(l=>l.tasks).filter(t=>t.source?.type==='textbook').map(t=>Number(/№\s*(\d+)/.exec(t.source.reference)?.[1])));
for(let n=268;n<=509;n++)if(!rootNumbers.has(n))throw Error('Missing chapter II exercise '+n);
// Study order follows the reviewed source coverage, without changing any URL index.
const coverage=rootsFiles.slice(0,3).flatMap(file=>read(file).coverage).sort((a,b)=>a.number-b.number);
if(coverage.length!==242||new Set(coverage.map(c=>c.number)).size!==242)throw Error('Expected one coverage record per chapter II exercise');
const chapterTasks=new Map(lessons.filter(l=>l.order>=10&&l.order<=19).flatMap(l=>l.tasks.map(t=>[t.id,t])));
for(const c of coverage){
 if(!Number.isInteger(c.number)||c.number<268||c.number>509||!Array.isArray(c.taskIds)||!c.taskIds.length)throw Error('Invalid source coverage record');
 for(const id of c.taskIds){const task=chapterTasks.get(id);if(!task||task.source.type!=='textbook'||Number(/№\s*(\d+)/.exec(task.source.reference)?.[1])!==c.number)throw Error('Coverage/source mismatch '+c.number+' '+id);}
}
for(const l of lessons.filter(l=>l.order>=10&&l.order<=19)){
 const positions=new Map(l.tasks.map((t,i)=>[t.id,i]));
 const sourceIds=coverage.flatMap(c=>c.taskIds).filter(id=>positions.has(id));
 const expected=l.tasks.filter(t=>t.source.type==='textbook').map(t=>t.id);
 if(sourceIds.length!==expected.length||new Set(sourceIds).size!==sourceIds.length||expected.some(id=>!sourceIds.includes(id)))throw Error('Incomplete study order '+l.id);
 const ordered=new Set(sourceIds);l.studyOrder=[...sourceIds,...l.tasks.filter(t=>!ordered.has(t.id)).map(t=>t.id)].map(id=>positions.get(id));
}

for(const l of lessons){const ref=sourceMap.sections.find(s=>s.kind==='topic'&&s.id===l.order);if(!ref)throw Error('Unknown topic '+l.order);l.advanced=ref.advanced;l.page=ref.printedPage;l.sourceRange=ref.exerciseRange.join('–');l.chapter=sourceMap.chapters.find(c=>c.id===ref.chapter).title;}
if(lessons.length!==51||new Set(lessons.map(l=>l.order)).size!==51)throw Error('Expected exactly 51 topics');
const data={completedSourceRanges:[[1,1075],[1077,1102]],sourceAlternatives,edition:'makarychev8-2024',chapters:sourceMap.chapters,sourceMap,lessons};
fs.writeFileSync(path.join(__dirname,'data.js'),'/* Generated by build.cjs; edit chapter JSON sources. */\nwindow.MakarychevCourse='+JSON.stringify(data)+';\n');
console.log(JSON.stringify({topics:lessons.length,tasks:lessons.reduce((s,l)=>s+l.tasks.length,0),textbookTasks:lessons.flatMap(l=>l.tasks).filter(t=>t.source.type==='textbook').length}));
