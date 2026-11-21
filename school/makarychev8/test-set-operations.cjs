'use strict';
const assert=require('node:assert/strict'),C=require('./check.js'),G=require('./task-graphs.js'),M=require('./models.js'),ts=require('./exercises-898-910.json');
const find=id=>ts.find(t=>t.id==='p37-source-'+id);
assert(C.check(' я, р;г; и; е; о; о ',find('900-b-intersection')));assert(!C.check('г;е;о;р;и;а',find('900-b-intersection')));assert(C.check('BC',find('902-a')));assert(!C.check('BD',find('902-a')));
const t=find('906-peer');assert(C.check('-12',t));assert(C.check('999999999999',t));assert(!C.check('-15',t));assert(!C.check('0',t));assert(!C.check('1/3',t));
assert.deepEqual(G.setMembership(t.graph,'-15'),[true,true]);assert.deepEqual(G.setMembership(t.graph,'-12'),[true,false]);assert.deepEqual(G.setMembership(t.graph,'11'),[false,false]);assert.deepEqual(G.setMembership(find('907-a-union').graph,1),[false,false]);
for(let seed=0;seed<60;seed++)for(let level=1;level<=3;level++){
 const p=M.practiceSets(seed,level),a=new Set(p.graph.first),b=new Set(p.graph.second),expected=level===2?new Set([...a,...b]):new Set([...a].filter(x=>b.has(x)));
 assert.deepEqual(new Set(G.setTokens(p.answer,false).map(Number)),expected);assert(C.check(p.answer,p));assert(!C.check('ошибка',p));if(level===3)assert.match(p.prompt,/кратн/);for(const q of p.steps)assert(C.check(q.answer,q));
}
console.log('PASS duplicates, letters, reversed endpoints, an arbitrary signed counterexample and 180 independent operation variants');
