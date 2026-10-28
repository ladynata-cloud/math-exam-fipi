'use strict';
// Test oracle from source identity, deliberately independent of runtime helpers.
const assert=require('node:assert/strict');
function expectedTitle(lesson){
 const s=lesson.source,legacyFraction=s.collection==='main'&&s.exercise==='30'?{'1/2AB':'AB/2','1/4AB':'AB/4'}[s.subpart]:null;
 const part=s.subpart?' · '+(legacyFraction||s.subpart):'';
 if(s.collection==='main')return 'К задаче №'+s.exercise+part;
 if(s.collection==='selfcheck')return 'К вопросу №'+s.exercise+' для самопроверки'+part;
 assert.equal(s.collection,'theory','Caption oracle needs an explicit new source type');
 const prefix='Пункт '+s.point+' · ';
 assert(lesson.title.startsWith(prefix),'Published theory keeps its original title');
 return 'К пункту '+s.point+' · '+lesson.title.slice(prefix.length);
}
module.exports={expectedTitle};
