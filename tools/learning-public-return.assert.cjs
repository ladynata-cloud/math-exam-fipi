'use strict';
const assert=require('node:assert/strict');
// Existing launch tests still compare the exact public destination. Also require
// the new cabinet route, rather than accepting an external link as a fallback.
module.exports=function publicDestination(value){
  const url=new URL(value,'https://cabinet.example/learning/');
  assert.equal(url.pathname,'/learning/');
  const params=new URLSearchParams(url.hash.slice(1));
  assert.deepEqual([...params.keys()],['public-practice','return']);
  assert(params.get('return'));assert(!/[&?#]/.test(params.get('return')));
  const target=new URL(params.get('public-practice'),'https://mathexam.space');
  assert.equal(target.origin,'https://mathexam.space');
  return target.href;
};
