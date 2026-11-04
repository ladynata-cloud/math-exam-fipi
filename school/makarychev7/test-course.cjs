'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const C=require('./check.js'),M=require('../peterson6/math.js');
const w={};vm.runInNewContext(fs.readFileSync(__dirname+'/data.js','utf8'),{window:w});const D=w.MakarychevCourse;
assert.equal(D.lessons.length,46);assert.equal(new Set(D.lessons.map(l=>l.id)).size,46);
assert.deepEqual(Array.from(D.lessons,l=>l.order),Array.from({length:46},(_,i)=>i+1));
const ids=new Set(),skills=new Set(M.skills.map(s=>s.id));let tasks=0,steps=0,source=0;
for(const l of D.lessons){
 assert(l.theory.length>=3,l.id+' theory');assert(l.tasks.length>=6,l.id+' tasks');
 assert(['numberline','expression','equation','function','power','divisibility','polynomial','identity','system','halfplane'].includes(l.model),l.id+' model');assert(l.title&&l.page&&l.sourceRange,l.id+' metadata');
 const ref=D.sourceMap.sections.find(s=>s.kind==='topic'&&s.id===l.order);assert.equal(l.page,ref.printedPage);
 for(const t of l.tasks){tasks++;assert(!ids.has(t.id),'Duplicate '+t.id);ids.add(t.id);assert(t.prompt&&t.finalLabel&&t.hint&&t.explanation,t.id+' incomplete');assert(t.steps.length>=2,t.id+' steps');
  assert(C.check(t.answer,t),t.id+' rejects canonical answer '+t.answer);assert(!C.check('',t),t.id+' blank accepted');assert(!C.check('garbage'+t.answer,t),t.id+' invalid accepted');
  for(const a of t.accepts||[])assert(C.check(a,t),t.id+' rejects alias '+a);
  for(const s of t.skills||[])assert(skills.has(s),t.id+' unknown skill '+s);
  if(t.kind==='choice'){assert(t.choices.length>=2,t.id);assert.equal(t.choices.filter(x=>x===t.answer).length,1,t.id+' ambiguous choice');}
  for(const q of t.steps){steps++;assert(q.prompt&&q.hint&&q.explanation,t.id+' incomplete step');assert(C.check(q.answer,q),t.id+' step rejects '+q.answer);}
  assert(['textbook','authored'].includes(t.source.type),t.id+' source');if(t.source.type==='textbook'){source++;const n=Number(/№\s*(\d+)/.exec(t.source.reference)?.[1]);assert(n>=1&&n<=1247,t.id+' bad source number');assert(t.source.page>=5&&t.source.page<=237,t.id+' bad source page');const section=D.sourceMap.sections.find(s=>s.exerciseNumbers.includes(n));assert(section,t.id+' source unindexed');assert.equal(section.id,l.order,t.id+' source outside topic');assert(t.source.page>=section.printedPage&&t.source.page<=section.printedEndPage,t.id+' page outside topic');const first=D.sourceMap.exercisePages[n],next=D.sourceMap.exercisePages[n+1]||section.printedEndPage;assert(t.source.page>=first&&t.source.page<=next,t.id+' page outside exercise header range '+first+'–'+next);}
  assert(!JSON.stringify(t).includes('{{frac:{{'),t.id+' nested unsupported fraction');for(const q of [t,...t.steps]){if(q.kind==='text')assert(C.check(q.answer.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g,m=>'^'+Array.from(m,c=>'⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)).join('')),q),t.id+' exponent entry');}
 }
}
assert(C.check('0,5',{answer:'1/2',kind:'number'}));assert(!C.check('1/0',{answer:'0',kind:'number'}));
assert(C.check('3; -2',{answer:'-2;3',kind:'set'}));assert(!C.check('3;3',{answer:'-2;3',kind:'set'}));assert(!C.check('3',{answer:'-2;3',kind:'set'}));
assert(C.check('x^2 − 4',{answer:'x²-4',kind:'text'}));assert(!C.check('x²+4',{answer:'x²-4',kind:'text'}));
assert(C.check('5/(6*x)',{answer:'5/(6x)',kind:'text'}));assert(C.check('x^3/(8*y^3)',{answer:'x³/(8y³)',kind:'text'}));assert(!C.check('2*3',{answer:'23',kind:'text'}));
assert(!C.check('2abc',{answer:'2',kind:'number'}));assert(!C.check('1e309',{answer:'1',kind:'number'}));
assert(C.check('x^12+x^5',{kind:'text',answer:'x¹²+x⁵'}));assert(!C.check('x^21+x^5',{kind:'text',answer:'x¹²+x⁵'}));
for(const [id,decimal] of [['p09-t01','214.178'],['p09-t03','6.9']]){const t=D.lessons.flatMap(l=>l.tasks).find(t=>t.id===id);assert(t,id+' exists');assert(!C.check(decimal,t),id+' accepts a decimal as an ordered pair');}
const allNumbers=D.sourceMap.sections.flatMap(s=>Array.from(s.exerciseNumbers||[]));assert.equal(allNumbers.length,1247);assert.equal(new Set(allNumbers).size,1247);
console.log(JSON.stringify({status:'PASS',topics:46,tasks,steps,textbookTasks:source,exerciseMap:1247,checks:'schema, source refs, accepted answers, steps, input boundaries, root sets'}));
