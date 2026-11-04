'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),M=require('../peterson6/math.js'),C=require('./check.js');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(__dirname+'/data.js','utf8'),ctx);const D=ctx.window.NikolskyCourse;
assert.equal(D.lessons.length,90);assert.equal(D.lessons.filter(l=>l.advanced).length,31);assert.equal(D.chapters.length,3);
const ids=new Set(),validSkills=new Set(M.skills.map(s=>s.id));let tasks=0,steps=0,sourceTasks=0;
for(const l of D.lessons){
 assert(l.id&&l.section&&l.title&&l.page,'Metadata '+l.id);assert(l.theory.length>=3,l.id+' theory');assert(l.tasks.length>=3,l.id+' tasks');
 for(const t of l.tasks){tasks++;assert(!ids.has(t.id),'Duplicate '+t.id);ids.add(t.id);assert(t.title&&t.prompt&&t.finalLabel&&t.hint&&t.explanation,t.id+' text');assert(t.steps.length>=2,t.id+' steps');
  for(const sk of t.skills||[])assert(validSkills.has(sk),t.id+' skill '+sk);
  for(const q of [t,...t.steps]){assert.equal(typeof q.answer,'string',t.id+' answer must be a string');assert(q.answer.trim(),t.id+' empty answer');assert(C.check(q.answer,q),t.id+' answer rejected '+q.answer);assert(!C.check('__wrong__',q),t.id+' accepts garbage');if(q.kind==='choice'){assert(q.choices&&q.choices.includes(q.answer),t.id+' choice');assert.equal(new Set(q.choices).size,q.choices.length,t.id+' choices unique');}for(const alias of q.accepts||[])assert(C.check(alias,q),t.id+' alias '+alias);}
  steps+=t.steps.length;assert(['textbook','authored'].includes(t.source?.type),t.id+' source');if(t.source.type==='textbook'){sourceTasks++;assert(/^№\s*\d+\.\d+/.test(t.source.reference),t.id+' source reference');assert(Number.isInteger(t.source.page)&&t.source.page>=3&&t.source.page<=405,t.id+' source page');}
 }
}
assert.equal(C.check('0,5',{answer:'1/2'}),true);assert(C.check('2π/3',{kind:'text',answer:'2pi/3'}));assert(C.check('3;1',{kind:'set',answer:'1;3'}));assert(!C.check('1;1',{kind:'set',answer:'1;3'}));assert(!C.check('Infinity',{answer:'0'}));
const all=JSON.stringify(D.lessons);assert(!all.includes('TODO'));assert(!all.includes('undefined'));assert(!all.includes('Алимов'));assert(!all.includes('Макарычев'));
console.log(JSON.stringify({gate:'NIKOLSKY10_CONTENT_OK',topics:D.lessons.length,tasks,steps,sourceTasks}));
