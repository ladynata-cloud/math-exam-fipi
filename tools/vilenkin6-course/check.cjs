const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..','..','courses','vilenkin-6-part-1');require(path.join(root,'math.js'));
const {equivalent,parse,fmt}=global.CourseMath;
for(const [a,b] of [['0,75','3/4'],['1 1/2','1,5'],['12/8','1 1/2'],['-0,5','-1/2'],['-1 1/2','-3/2'],['0.000001','1/1000000'],['1/2','2/4']])assert(equivalent(a,b),a+'='+b);
for(const [a,b] of [['','0'],['1/0','0'],['0,3','1/3'],['2abc','2'],['1+1','2'],['1 1/2','1/2']])assert(!equivalent(a,b),a+'!='+b);
assert.equal(parse('Infinity'),null);assert.equal(parse('1e3'),null);assert(!fmt('<img onerror=x>').includes('<img'));
const lessons=[1,2,3,4,5].flatMap(n=>JSON.parse(fs.readFileSync(path.join(root,'data/lessons-'+n+'.json'))));
assert.equal(new Set(lessons.map(l=>l.id)).size,27);assert.deepEqual(lessons.map(x=>x.id).sort((a,b)=>a-b),Array.from({length:27},(_,i)=>i));let tasks=0,examples=0,steps=0;
for(const l of lessons){assert(l.rules.length>=3);assert(l.tasks.length>=15);assert(l.examples.length>=3);assert(l.page>=4&&l.endPage<=156);const ids=new Set();for(const id of l.prereq)assert(lessons.some(x=>x.id===id)&&id!==l.id);
 const check=q=>{assert(typeof q.prompt==='string'&&q.prompt.length>3);assert(q.answer!==undefined);assert(equivalent(String(q.answer),q.answer),'answer reflexivity '+q.prompt);if(q.options)assert(q.options.some(o=>equivalent(o,q.answer)),'MC correct missing '+q.prompt)};
 for(const t of l.tasks){tasks++;assert(!ids.has(t.id));ids.add(t.id);check(t);assert(t.hint.length>5&&t.solution.length>=1)}
 for(const e of l.examples){examples++;check(e);assert(e.steps.length>=2);for(const s of e.steps){steps++;check(s);assert(s.hint.length>3&&s.explain.length>3)}}
}
const book=JSON.parse(fs.readFileSync(path.join(root,'data/textbook-index.json')));assert.equal(book.exercises.length,968);assert.equal(new Set(book.exercises.map(e=>e.number)).size,968);
for(const [ch,count] of [[1,198],[2,540],[3,193]])for(let n=1;n<=count;n++)assert(book.exercises.some(e=>e.number===`${ch}.${n}`));
for(const e of [...book.exercises,...book.checks]){assert.equal(e.pdfPage,e.printedPage+1);assert(e.pdfPage>0&&e.pdfPage<=163);assert(lessons.some(l=>l.id===e.lesson))}
console.log(JSON.stringify({status:'PASS',lessons:lessons.length,tasks,examples,steps,originalExercises:book.exercises.length,originalChecks:book.checks.length,numericInput:'exact rational',checks:'content schema, unique ids, full original numbering, answer options, references, fraction equality, input rejection'}));
