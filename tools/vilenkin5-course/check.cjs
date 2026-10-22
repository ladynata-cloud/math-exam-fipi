'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..','..','courses','vilenkin-5-part-1');
require(path.join(root,'math.js'));
const {equivalent,parse,fmt}=global.CourseMath;
for(const [a,b] of [['123','123'],['0','0'],['1 1/2','1,5'],['12/8','1 1/2'],['0,75','3/4']])assert(equivalent(a,b));
for(const a of ['3 005 008','3\u00a0005\u00a0008','3\u202f005\u202f008'])assert(equivalent(a,'3005008'));
assert.equal(parse('12 34'),null);assert(equivalent('1 1/2','1,5'),'mixed fractions retain their meaning');
for(const [a,b] of [['','0'],['1/0','0'],['2abc','2'],['1+1','2'],['0,3','1/3']])assert(!equivalent(a,b));
assert.equal(parse('Infinity'),null);assert.equal(parse('1e3'),null);assert(!fmt('<img onerror=x>').includes('<img'));
assert.equal(fmt('3^4 + a^n'),'3<sup>4</sup> + a<sup>n</sup>');assert(!fmt('<script>^2</script>').includes('<script>'));
const lessons=[1,2,3,4,5].flatMap(n=>JSON.parse(fs.readFileSync(path.join(root,'data/lessons-'+n+'.json'))));
assert.equal(lessons.length,29);assert.deepEqual(lessons.map(x=>x.id).sort((a,b)=>a-b),Array.from({length:29},(_,i)=>i));
const skills=new Set(['add','subtract','multiply','divide','remainder','table','place','order','power','divisibility','units']);
const starts={1:7,2:11,3:16,4:22,5:27,6:33,7:38,8:44,9:52,10:60,11:69,12:79,13:86,14:94,15:98,16:107,17:113,18:118,19:123,20:132,21:136,22:141,23:146,24:150,25:42,26:77,27:130,28:156};
const allIds=new Set();let tasks=0,examples=0,steps=0;
const norm=s=>s.toLocaleLowerCase('ru').replace(/\s+/g,' ').trim();
for(const l of lessons){
 assert(l.title&&l.goal);assert(l.rules.length>=3);assert(l.pitfalls.length>=2);assert(l.tasks.length>=18);assert(l.examples.length>=3);
 if(l.id)assert.equal(l.page,starts[l.id],'source start '+l.id);assert(l.page>=3&&l.endPage>=l.page&&l.endPage<=157);
 assert(l.skills?.length,'missing lesson arithmetic context '+l.id);for(const s of l.skills)assert(skills.has(s),s);
 for(const id of l.prereq)assert(lessons.some(x=>x.id===id)&&id!==l.id);
 function check(q){assert(typeof q.prompt==='string'&&q.prompt.length>3);assert(q.answer!==undefined);assert(equivalent(String(Array.isArray(q.answer)?q.answer[0]:q.answer),q.answer),'answer reflexivity '+q.prompt);if(q.options){assert(q.options.length>=2);assert.equal(q.options.filter(o=>equivalent(o,q.answer)).length,1,'one choice must match '+q.prompt);assert.equal(new Set(q.options).size,q.options.length)}for(const s of q.skills||[])assert(skills.has(s),s)}
 for(const t of l.tasks){tasks++;assert(!allIds.has(t.id),'task id '+t.id);allIds.add(t.id);check(t);assert(t.hint.length>5&&t.solution.length>=1);assert(['start','practice','challenge'].includes(t.level))}
 const seen=new Set(l.tasks.slice(0,-5).map(t=>norm(t.prompt)));
 for(const e of l.examples){examples++;check(e);seen.add(norm(e.prompt));assert(e.steps.length>=2);for(const s of e.steps){steps++;check(s);assert(s.hint.length>3&&s.explain.length>3)}}
 for(const t of l.tasks.slice(-5))assert(!seen.has(norm(t.prompt)),'independent check repeats a training prompt: '+l.id+' '+t.id);
}
const book=JSON.parse(fs.readFileSync(path.join(root,'data/textbook-index.json')));
assert(book.exercises.length>0);const entries=[...book.exercises,...(book.checks||[])];assert.equal(new Set(entries.map(e=>e.number)).size,entries.length);
for(const e of entries){assert.equal(e.pdfPage,e.printedPage-2);assert(e.pdfPage>=1&&e.pdfPage<=158);assert(lessons.some(l=>l.id===e.lesson));assert(typeof e.number==='string'&&e.number.length<60)}
for(let id=1;id<=28;id++)assert(entries.some(e=>e.lesson===id),'source references missing lesson '+id);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');for(const f of ['styles.css','practice.css','math.js','labs.js','practice.js','app.js'])assert(html.includes('"'+f+'"'));
assert(html.includes('5 класс'));assert(html.includes('vilenkin-5-part-1'));assert(!html.includes('6 класс'));
console.log(JSON.stringify({status:'PASS',lessons:lessons.length,tasks,examples,steps,sourceEntries:entries.length,checks:'schema, complete topic IDs, exact source pages, answer options, fresh independent prompts, arithmetic context, exact rational input'}));
