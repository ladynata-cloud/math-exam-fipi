'use strict';
const assert = require('node:assert/strict');
const {test} = require('node:test');
const {stations,rounds,card} = require('../trainers/oge-basics/multiplication-division/arzhenikov-garden-bank.js');

test('all 512 missions and review cards describe their exact arithmetic',()=>{
  const prompts=new Set();
  for (const s of stations) for(let i=0;i<rounds;i++) for (const mode of [0,1,2,3]) {
    const phase=Math.min(mode,2), c=card(s.id,i,phase,mode===3);
    assert(!prompts.has(c.prompt),'duplicate condition: '+c.prompt); prompts.add(c.prompt);
    const nums=c.prompt.match(/\d+/g).map(Number);
    const expected=(()=>{
      const [a,b]=nums, q=Math.floor(a/b), r=a%b;
      switch(s.id){
        case 'count':return phase<2 ? [a*b] : [a+b,a+2*b];
        case 'share':return phase===0 ? [b/a] : phase===1 ? [a/b] : [a/b+1,a+b];
        case 'pack':return phase===0 ? [q,r] : phase===1 ? [q] : [q,b-r];
        case 'inverse':return phase===0 ? [a/b] : phase===1 ? [a*b,nums[2]/b] : [b/a+1];
        case 'bridge':return phase===0 ? [q,q*b] : phase===1 ? [q,r] : [Math.floor(q/10),(Math.floor(q/10)+1)*b];
        case 'zero':return phase===0 ? [Math.floor(a/b/10)%10,(a/b)%10] : phase===1 ? [a/b] : [a/nums[2],b/nums[2]];
        case 'remainder':return phase===0 ? [Math.floor(b/a),b%a] : [q,Math.ceil(a/b)];
        case 'transfer':return phase===2 ? [q,r,a-r] : [q,r];
      }
    })();
    assert.deepEqual(c.fields.filter(f=>!f.options).map(f=>f.answer),expected,c.prompt);
    for(const f of c.fields.filter(f=>f.options))
      for(const answer of [].concat(f.answer)) assert(f.options.some(([value])=>value===answer));
    assert(c.why.length>10 && c.hint.length>10);
    if(phase===2) assert.equal(c.model,null);
  }
  assert.equal(prompts.size,512);
});
