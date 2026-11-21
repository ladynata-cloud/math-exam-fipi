const {test}=require('node:test');const assert=require('node:assert/strict');const q=require('../trainers/group-board-queue');
const owner=q.principal('https://server.invalid','lesson',{role:'teacher'});
const state={outbox:[{opId:'original',type:'undo',target:'s1',payload:{}}],rejected:[],inkPreviews:{original:{actor:'teacher'}}};
test('server, lesson and authenticated actor isolate queues without credentials',()=>{
 const identities=[owner,q.principal('https://other.invalid','lesson',{role:'teacher'}),q.principal('https://server.invalid','other',{role:'teacher'}),q.principal('https://server.invalid','lesson',{role:'student',seatId:'s1'}),q.principal('https://server.invalid','lesson',{role:'student',seatId:'s2'})];
 assert.equal(new Set(identities.map(q.key)).size,5);assert.throws(()=>q.principal('s','l',{role:'observer'}));
});
test('same principal restores exact operations and preview after lost acknowledgement',()=>{assert.deepEqual(q.restore(q.encode(owner,state),owner),state);assert.deepEqual(state.outbox[0].payload,{});});
test('foreign envelope and ambiguous legacy queue never replay',()=>{
 assert.throws(()=>q.restore(q.encode('other',state),owner));assert.throws(()=>q.restore(JSON.stringify(state),owner));assert.throws(()=>q.restore('{',owner));
});
test('missing queue starts empty without adopting another key',()=>{assert.deepEqual(q.restore(null,owner),{outbox:[],rejected:[],inkPreviews:{}});});

test('malformed stored operations are blocked rather than crashing render or pump',()=>{for(const outbox of [[null],[42],[{}]])assert.throws(()=>q.restore(q.encode(owner,{...state,outbox}),owner));assert.throws(()=>q.restore(q.encode(owner,{...state,rejected:[null]}),owner));});
