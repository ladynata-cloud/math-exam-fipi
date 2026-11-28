'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {capability, checkEvolution} = require('./board-platform-preflight.cjs');
const mirror=(id,patch={})=>({trainerId:id,file:'trainers/'+id+'.html',title:id,group:'fixture',boardCompatibility:'board-mirror',supportsSeed:false,supportsBoardMirror:true,version:'1.0.0',stateSchemaVersion:1,bridgeProtocolVersion:1,allowLegacyHtml:false,...patch});
const standalone=mirror('standalone',{boardCompatibility:'opens-in-board',supportsBoardMirror:false});
const base={schemaVersion:1,trainers:[mirror('alpha'),mirror('legacy',{allowLegacyHtml:true}),standalone]};
const visible=new Set(['alpha','legacy']);
function check(rows,receipts=[],nextVisible=visible,oldReceipts=[]){
  return checkEvolution(base,{schemaVersion:1,trainers:rows},oldReceipts,receipts,visible,nextVisible);
}
const unchanged=()=>structuredClone(base.trainers);
const receipt=(before,after)=>({trainerId:before.trainerId,before:capability(before),after:capability(after),reason:'Reviewed explicit compatibility change for this trainer.'});
test('add any number of structured mirrors without changing other tests',()=>{
  const rows=unchanged(),shown=new Set(visible);
  for(let i=0;i<100;i++){const id='new-'+i;rows.unshift(mirror(id));shown.add(id);}
  const result=check(rows,[],shown);
  assert.deepEqual(result.errors,[]);assert.equal(result.additions.length,100);
});
test('order and editorial metadata are not authorization changes',()=>{
  const rows=unchanged().reverse();rows[0].title='New title';rows[0].group='New group';
  assert.deepEqual(check(rows).errors,[]);
});
test('reject omitted or redirected new mirror and loss of an existing picker route',()=>{
  assert.match(check([...unchanged(),mirror('new')]).errors.join(' '),/new: missing reachable/);
  assert.match(check(unchanged(),[],new Set(['legacy'])).errors.join(' '),/alpha: missing reachable/);
});
test('reject removing, repointing, upgrading or downgrading a capability silently',()=>{
  for(const patch of [{file:'trainers/replacement.html'},{version:'1.1.0'},{stateSchemaVersion:2},{bridgeProtocolVersion:2},{supportsSeed:true},{supportsProgressTracking:true,progressSchemaVersion:1},{boardCompatibility:'opens-in-board',supportsBoardMirror:false}]){
    const rows=unchanged();Object.assign(rows[0],patch);
    assert.match(check(rows).errors.join(' '),/alpha: existing capability changed/,JSON.stringify(patch));
  }
  assert.match(check(unchanged().slice(1)).errors.join(' '),/alpha: existing capability changed/);
});
test('a precise new review receipt allows an intentional change, not a stale or mismatched receipt',()=>{
  const rows=unchanged();rows[0].version='1.1.0';
  const r=receipt(base.trainers[0],rows[0]);
  assert.deepEqual(check(rows,[r]).errors,[]);
  assert.deepEqual(check(rows,[r]).approved,['alpha']);
  assert.match(check(rows,[r],visible,[r]).errors.join(' '),/without one exact new/);
  assert.match(check(rows,[{...r,after:{...r.after,version:'9.9.9'}}]).errors.join(' '),/without one exact new/);
  assert.match(check(rows,[r,r]).errors.join(' '),/without one exact new/);
  assert.match(check(unchanged(),[r]).errors.join(' '),/Unmatched/);
  assert.match(check(unchanged(),[],visible,[r]).errors.join(' '),/append-only/);
});
test('review receipt cannot extend legacy HTML permission',()=>{
  const rows=unchanged();rows[0].allowLegacyHtml=true;
  assert.match(check(rows,[receipt(base.trainers[0],rows[0])]).errors.join(' '),/legacy HTML authorization is prohibited/);
  assert.match(check([...unchanged(),mirror('new',{allowLegacyHtml:true})],[],new Set([...visible,'new'])).errors.join(' '),/legacy HTML authorization is prohibited/);
});
test('catalog-only promotion must have both a review receipt and reachable board entry',()=>{
  const rows=unchanged();rows[2]=mirror('standalone');
  const r=receipt(base.trainers[2],rows[2]);
  assert.match(check(rows,[r]).errors.join(' '),/standalone: missing reachable/);
  assert.deepEqual(check(rows,[r],new Set([...visible,'standalone'])).errors,[]);
});
test('previously hidden legacy compatibility route can remain, but no new hidden mirror',()=>{
  const before=new Set(['alpha']);
  assert.deepEqual(checkEvolution(base,base,[],[],before,before).errors,[]);
  assert.match(checkEvolution(base,{...base,trainers:[...base.trainers,mirror('missing')]},[],[],before,before).errors.join(' '),/missing: missing reachable/);
});
