/* Revision-aware local progress. Validate before migrating; never discard results. */
(function(root){
'use strict';
const C=typeof module!=='undefined'&&module.exports?require('./course.js'):root.SovietMath;
const ids=new Set(C.topics.map(t=>t.id));
const revisedIds=new Set(C.topics.slice(0,30).map(t=>t.id));
const plain=value=>value&&typeof value==='object'&&!Array.isArray(value);
const defaults=motion=>({version:2,courseRevision:C.revision,lastTopic:'',lastMode:'learn',sessions:{},previousSessions:{},records:[],motion:!!motion});
function session(key,v,revision){
 if(!plain(v)||!ids.has(v.topic)||!['learn','practice'].includes(v.mode)||key!==v.topic+':'+v.mode||!Number.isInteger(v.index)||v.index<0||v.index>100000||!Number.isInteger(v.step)||typeof v.accepted!=='boolean'||typeof v.done!=='boolean'||typeof v.draft!=='string'||v.draft.length>40||!Number.isInteger(v.errors)||v.errors<0||!Number.isInteger(v.help)||v.help<0)throw Error('session');
 const p=(revision===1?C.legacyMake:C.make)(v.topic,v.index);
 if(v.step<0||v.step>=p.steps.length||v.done!==(v.step===p.steps.length-1&&v.accepted))throw Error('steps');
}
function readState(input){
 if(!plain(input)||![1,2].includes(input.version)||!plain(input.sessions)||!Array.isArray(input.records)||input.records.length>10000||typeof input.motion!=='boolean')throw Error('record');
 const revision=input.courseRevision===undefined?1:input.courseRevision;
 if((input.version===1&&revision!==1)||(input.version===2&&revision!==C.revision))throw Error('version');
 if(![1,C.revision].includes(revision))throw Error('revision');
 if(typeof input.lastTopic!=='string'||(input.lastTopic&&!ids.has(input.lastTopic)))throw Error('topic');
 if(!['learn','practice'].includes(input.lastMode))throw Error('mode');
 for(const [key,value]of Object.entries(input.sessions))session(key,value,revision);
 if(input.previousSessions!==undefined){
  if(!plain(input.previousSessions)||revision!==C.revision)throw Error('previous');
  for(const [key,value]of Object.entries(input.previousSessions))session(key,value,1);
 }
 for(const r of input.records)if(!plain(r)||!ids.has(r.topic)||!Number.isInteger(r.index)||r.index<0||r.index>100000||!Number.isFinite(r.at)||!Number.isInteger(r.errors)||r.errors<0||!Number.isInteger(r.help)||r.help<0||typeof r.repeated!=='boolean'||(revision===1?![undefined,1].includes(r.revision):![1,C.revision].includes(r.revision)))throw Error('result');
 // Clone only after every field has been checked. The caller retains the exact
 // original storage string for the existing cross-tab compare-and-save guard.
 const state=JSON.parse(JSON.stringify(input));
 state.previousSessions=state.previousSessions||{};
 if(revision===1){
  for(const [key,value]of Object.entries(state.sessions))if(revisedIds.has(value.topic)){
   state.previousSessions[key]=value;
   delete state.sessions[key];
  }
  state.records=state.records.map(record=>({...record,revision:record.revision||1}));
 }
 state.version=2;
 state.courseRevision=C.revision;
 return {state,migrated:revision!==C.revision};
}
const api={defaults,readState};root.SovietProgress=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
