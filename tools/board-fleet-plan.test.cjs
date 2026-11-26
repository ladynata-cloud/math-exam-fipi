'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {mirrors,selectMirrors,partition,args}=require('./board-fleet-plan.cjs');
const m=(id,file='trainers/'+id+'.html',patch={})=>({trainerId:id,file,version:'1.0.0',stateSchemaVersion:1,bridgeProtocolVersion:1,allowLegacyHtml:false,boardCompatibility:'board-mirror',...patch});
const old={trainers:[m('b'),m('a','trainers/a/index.html'),m('solo','trainers/solo.html',{boardCompatibility:'opens-in-board'})]};
const ids=result=>result.entries.map(x=>x.trainerId);
test('full scan includes only registered mirrors in deterministic order',()=>{
  assert.deepEqual(ids(selectMirrors(old,old,[],true)),['a','b']);
  assert.deepEqual(mirrors(old).map(x=>x.trainerId),['a','b']);
});
test('new mirror and changed capability are selected without hard-coded size',()=>{
  const fresh={trainers:[...old.trainers.map(x=>x.trainerId==='b'?{...x,version:'1.1.0'}:x),m('c')]};
  assert.deepEqual(ids(selectMirrors(fresh,old,['trainers/board-compat.json'])),['b','c']);
  assert.deepEqual(ids(selectMirrors(old,old,['trainers/board-compat.json'])),[]);
});
test('local source changes select the matching nested and flat trainers',()=>{
  assert.deepEqual(ids(selectMirrors(old,old,['trainers/a/core.js'])),['a']);
  assert.deepEqual(ids(selectMirrors(old,old,['trainers/b-app.js'])),['b']);
  assert.deepEqual(ids(selectMirrors(old,old,['trainers/solo.html','docs/notes.md'])),[]);
});
test('shared host, bridge and audit changes require a full scan',()=>{
  for(const file of ['trainers/trainer-board.html','trainers/board-bridge.js','trainers/board-picker.js','board-server/index.js','tools/board-fleet-audit.cjs','.github/workflows/board-fleet-acceptance.yml']){
    assert.deepEqual(ids(selectMirrors(old,old,[file])),['a','b'],file);
  }
});
test('shards cover large catalogs exactly once including empty shards',()=>{
  const rows=Array.from({length:123},(_,i)=>m('item-'+i));
  const parts=Array.from({length:6},(_,i)=>partition(rows,i,6)).flat();
  assert.equal(parts.length,123);assert.equal(new Set(parts.map(x=>x.trainerId)).size,123);
  assert.deepEqual(partition(rows,124,125),[]);
  assert.throws(()=>partition(rows,6,6),/Invalid shard/);
});
test('CLI rejects unknown arguments and ambiguous manual scope',()=>{
  assert.throws(()=>args(['--bogus']),/Unknown/);
  assert.throws(()=>args(['--all','--base','abc']),/either/);
  assert.deepEqual(args(['--all','--index','2','--total','6','--plan']),{all:true,base:'',index:2,total:6,planOnly:true});
});
