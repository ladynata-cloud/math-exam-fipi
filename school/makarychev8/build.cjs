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
const data={completedSourceRanges:[[1,509]],edition:'makarychev8-2024',chapters:sourceMap.chapters,sourceMap,lessons};
fs.writeFileSync(path.join(__dirname,'data.js'),'/* Generated by build.cjs; edit chapter JSON sources. */\nwindow.MakarychevCourse='+JSON.stringify(data)+';\n');
console.log(JSON.stringify({topics:lessons.length,tasks:lessons.reduce((s,l)=>s+l.tasks.length,0),textbookTasks:lessons.flatMap(l=>l.tasks).filter(t=>t.source.type==='textbook').length}));
