'use strict';
/* Assertions compare the retained legacy projection and new assistance facts
 * separately. The new optional audit field must not hide score/history changes. */
const assert=require('node:assert/strict');
const TID='oge-t11-grafiki';
function legacy(value){
 const data=typeof value==='string'?JSON.parse(value||'{}'):JSON.parse(JSON.stringify(value||{}));
 const rec=data[TID];
 if(rec&&rec.ext&&Object.hasOwn(rec.ext,'auditLearning')){
  delete rec.ext.auditLearning;
  if(Object.keys(rec.ext).length===0)delete rec.ext;
  if(Object.keys(rec).length===0)delete data[TID];
 }
 return data;
}
function helpFacts(value,module='m4'){
 const data=typeof value==='string'?JSON.parse(value||'{}'):value||{};
 const audit=data[TID]?.ext?.auditLearning;
 assert.equal(audit?.v,1,'new versioned help evidence exists');
 assert.equal(audit.draft?.[module]?.helpUsed,true,'the active '+module+' attempt retains assistance');
 assert.equal(audit.attempts.length,0,'opening help never completes an attempt');
 return audit;
}
module.exports={legacy,helpFacts};
