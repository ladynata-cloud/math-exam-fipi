'use strict';
const assert=require('node:assert/strict');
// Exact inverse of the three reviewed input-safety edits; original hash pins stay unchanged.
const changes=[
  {
    "scope": "arithmetic",
    "original": "function isqrtB(x){if(x<0n)return null;if(x<2n)return x;let r=BigInt(Math.floor(Math.sqrt(Number(x))));while(r*r>x)r--;while((r+1n)*(r+1n)<=x)r++;return r*r===x?r:null}",
    "current": "function isqrtB(x){\n  if(x<0n)return null;if(x<2n)return x;\n  // Start above the root and stay in exact integer arithmetic, even for large input.\n  let r=1n<<BigInt(Math.ceil(x.toString(2).length/2)),next=(r+x/r)/2n;\n  while(next<r){r=next;next=(r+x/r)/2n;}\n  return r*r===x?r:null;\n}"
  },
  {
    "scope": "arithmetic",
    "original": "function fmtFr(f){ // человеческая запись: целое, десятичная с запятой или a/b\n  if(fint(f))",
    "current": "function fmtFr(f){ // человеческая запись: целое, десятичная с запятой или a/b\n  if(f.d===0n)return \"не определено\";\n  if(fint(f))"
  },
  {
    "scope": "quiz",
    "original": "      answered=true;\n      const ans=quizAns(t)",
    "current": "      if(x.d===0n){fb.textContent=\"На ноль делить нельзя: такая запись не задаёт число.\";fb.className=\"fb no\";return;}\n      answered=true;\n      const ans=quizAns(t)"
  }
];
function restoreNumericSafety(source,scope='all'){
  assert(['all','arithmetic','quiz'].includes(scope),'known numeric safety scope');
  let result=source;
  for(const {current,original} of changes.filter(c=>scope==='all'||c.scope===scope)){
    assert.equal(result.split(current).length,2,'exact numeric safety fragment must occur once: '+current.slice(0,60));
    result=result.replace(current,original);
  }
  return result;
}
function restoreNumericLayout(source){
  const layout='#sqFb{overflow-wrap:anywhere}\n';
  assert.equal(source.split(layout).length,2,'exact numeric feedback wrapping rule must occur once');
  return source.replace(layout,'');
}
module.exports={restoreNumericSafety,restoreNumericLayout};
