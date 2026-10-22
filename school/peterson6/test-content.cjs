const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const M=require('./math.js'),ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'data.js'),'utf8'),ctx);
const D=ctx.window.PetersonCourse,ids=new Set(),skills=new Set(M.skills.map(s=>s.id));let numeric=0,choice=0,steps=0;
assert.equal(D.lessons.length,14);assert.equal(Object.keys(D.exerciseIndex).length,497);
for(let n=1;n<=497;n++)assert(D.exerciseIndex[n]&&D.exerciseIndex[n].page>=6&&D.exerciseIndex[n].page<=110);
for(const [i,l] of D.lessons.entries()){
 assert.equal(l.id,'p'+String(i+1).padStart(2,'0'));assert(l.theory.length>=3);assert(l.tasks.length>=14);assert(l.page>0);assert(l.goals.length>=2);
 for(const t of l.tasks){assert(!ids.has(t.id));ids.add(t.id);assert(t.prompt&&t.finalLabel&&t.explanation&&t.hint);assert(['authored','textbook'].includes(t.source.type));
  for(const sk of t.skills||[])assert(skills.has(sk),t.id+': unknown skill '+sk);
  if(t.kind==='choice'){choice++;assert.equal(t.choices.filter(c=>c===t.answer).length,1,t.id);assert.equal(new Set(t.choices).size,t.choices.length);}
  else{numeric++;assert(M.parse(t.answer),t.id+' final '+t.answer);assert(M.check(t.answerFormat==='decimal'?M.decimal(t.answer):t.answer,t.answer,t.answerFormat),t.id+' invalid answer representation '+t.answer);assert(t.steps.length>=2);}
  for(const q of t.steps||[]){steps++;assert(q.prompt&&q.hint&&q.explanation);assert(M.parse(q.answer),t.id+' step '+q.answer);assert(M.check(q.answerFormat==='decimal'?M.decimal(q.answer):q.answer,q.answer,q.answerFormat),t.id+' invalid step representation '+q.answer+' '+q.answerFormat);}
 }
}
const all=JSON.stringify(D);assert(!/[\uE000-\uF8FF]/.test(all),'unresolved PDF glyph');assert(!all.includes('undefined'));assert(!all.includes('/workspace/'));
console.log(`Content PASS: ${ids.size} tasks (${numeric} numeric, ${choice} choice), ${steps} validated steps; 497 source mappings.`);
