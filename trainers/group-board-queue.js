/* Queue ownership is derived only after the server authenticates the session. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GroupBoardQueue=api;})(globalThis,function(){
  'use strict';
  function principal(server,lesson,snapshot){
    const actor=snapshot?.role==='teacher'?'teacher':snapshot?.role==='student'&&snapshot.seatId;
    if(!actor||!server||!lesson)throw Error('QUEUE_PRINCIPAL_REQUIRED');
    return JSON.stringify([server,lesson,actor]);
  }
  const key=owner=>'mathexam.group.outbox.v2.'+encodeURIComponent(owner);
  const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
  const action=value=>object(value)&&['opId','type','target'].every(key=>typeof value[key]==='string')&&object(value.payload);
  function restore(raw,owner){
    if(!raw)return {outbox:[],rejected:[],inkPreviews:{}};
    const saved=JSON.parse(raw);
    if(saved?.version!==2||saved.principal!==owner||!Array.isArray(saved.outbox)||!Array.isArray(saved.rejected)||!saved.outbox.every(action)||!saved.rejected.every(entry=>object(entry)&&action(entry.action)&&typeof entry.error==='string'))throw Error('QUEUE_OWNER_MISMATCH');
    return {outbox:saved.outbox,rejected:saved.rejected,inkPreviews:saved.inkPreviews&&typeof saved.inkPreviews==='object'&&!Array.isArray(saved.inkPreviews)?saved.inkPreviews:{}};
  }
  const encode=(owner,state)=>JSON.stringify({version:2,principal:owner,outbox:state.outbox,rejected:state.rejected,inkPreviews:state.inkPreviews});
  return Object.freeze({principal,key,restore,encode});
});
