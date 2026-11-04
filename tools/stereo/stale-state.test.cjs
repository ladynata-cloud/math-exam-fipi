'use strict';
const assert=require('node:assert/strict'),S=require('../../stereo-course/assets/store.js');
const disk=new Map();global.localStorage={getItem:key=>disk.get(key)||null,setItem:(key,value)=>disk.set(key,value)};
const a=S.open(['box','basis']),b=S.open(['box','basis']),first=a.get('box');
const one=a.put('box',{...first,seed:1,assisted:false,checked:false,draft:'old'},'start',first.updated);assert.equal(one.status,'saved');
const stale=a.get('box'),newer={...b.get('box'),seed:2,assisted:true,checked:true,independent:3,draft:'latest',seenTasks:['old task','new task']};
const two=b.put('box',newer,'hint',newer.updated);assert.equal(two.status,'saved');assert.ok(two.record.updated>one.record.updated);
const before=disk.get(S.KEY),summary=disk.get('mathExamStereoSummary.v1');const denied=a.put('box',{...stale,independent:99,assisted:false},'solved',stale.updated);assert.equal(denied.status,'conflict');assert.equal(disk.get(S.KEY),before);assert.equal(disk.get('mathExamStereoSummary.v1'),summary);assert.equal(denied.record.seed,2);assert.equal(denied.record.draft,'latest');
const sameStale=a.get('box'),help={...b.get('box'),assisted:true,hints:5,taskFirst:{version:1,mainDraft:'new draft',stepDraft:'another step',helpOpen:true}};b.put('box',help,'hint',help.updated);const sameBefore=disk.get(S.KEY);assert.equal(a.put('box',{...sameStale,assisted:false,independent:4},'solved',sameStale.updated).status,'conflict');assert.equal(disk.get(S.KEY),sameBefore);
// Monotonic revisions remain distinct even if the wall clock does not advance.
const now=Date.now;Date.now=()=>1;const current=a.get('box'),next=a.put('box',current,'edit',current.updated);const another=a.put('box',next.record,'edit',next.record.updated);Date.now=now;assert.equal(another.record.updated,next.record.updated+1);
// Existing callers without an expected revision and existing imports still work.
a.put('basis',{seed:7,written:'legacy caller'});assert.equal(a.get('basis').written,'legacy caller');const imported={...a.get('basis'),written:'newer import',updated:Date.now()+10000};a.import({version:1,units:{basis:imported}});assert.equal(a.get('basis').written,'newer import');assert.equal(a.get('box').seed,2);
delete global.localStorage;console.log('STEREO_STALE_STATE_OK: other seed, same-seed help, CAS no-write, monotonic revisions, legacy/import');
