/* Personal /ege-baza/path persistence only. Loading this file never opens storage. */
(function (root) {
  'use strict';
  const KEY = 'mathexam.ege-baza.path.v1', PREFIX = KEY + '.h03.', COPY_PREFIX = KEY + '.h03-copy.';
  const clone = value => JSON.parse(JSON.stringify(value));
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const plain = value => value && typeof value === 'object' && !Array.isArray(value);
  const integer = value => Number.isSafeInteger(value) && value >= 0 && value <= 1e9;
  const zero = () => ({writer:'', seq:0, deps:{}});
  const after = (a, b) => !b.writer || a.writer === b.writer && a.seq >= b.seq || (a.deps[b.writer] || 0) >= b.seq;
  const choose = (a, b) => !a ? b : after(b.stamp, a.stamp) ? b : after(a.stamp, b.stamp) ? a :
    (b.stamp.writer + ':' + b.stamp.seq > a.stamp.writer + ':' + a.stamp.seq ? b : a);
  const runKey = run => JSON.stringify([run.kind, run.seed, run.start]);
  const draftFields = ['draft','note','taskFirst.finalDraft','taskFirst.stepDraft','taskFirst.model'];
  function validExtras(value) {
    const text=(value,max=10000)=>typeof value==='string'&&value.length<=max;
    const draftOK=draft=>plain(draft)&&text(draft.lesson,200)&&text(draft.attempt,400)&&
      [...draftFields,'pastStepDraft','examDraft'].includes(draft.field)&&
      (draft.field==='taskFirst.model'?draft.value===null||plain(draft.value)&&JSON.stringify(draft.value).length<=16000:text(draft.value))&&
      (draft.step===undefined||integer(draft.step)&&draft.step<=20)&&(draft.seed===undefined||integer(draft.seed))&&
      (draft.condition===undefined||text(draft.condition,100000))&&(draft.source===undefined||text(draft.source,200));
    return ['recoveryDrafts','examDrafts'].every(key=>value[key]===undefined||Array.isArray(value[key])&&value[key].length<=10000&&value[key].every(draftOK));
  }
  const fieldValue = (row,field) => field.split('.').reduce((value,name)=>value?.[name],row);
  const fieldSet = (row,field,value) => {const parts=field.split('.');if(parts.length===1)row[field]=clone(value);else if(row[parts[0]])row[parts[0]][parts[1]]=clone(value);};
  function digest(value) {
    const copy = {...value}; delete copy.progressStore;
    const text = JSON.stringify(copy); let hash = 2166136261;
    for (let i=0;i<text.length;i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
    return text.length + ':' + (hash >>> 0).toString(16);
  }
  function create(options) {
    const {valid, decode, encode, task, condition, empty, notice} = options;
    let storage, writer, generation = 'initial', sequence = 0, blocked = false, lastScan = null, previous;
    let own = null, pendingBase = null, legacyCopy = null, olderPages = [], allRecords = [], unreadableRecords = [], copySerial = 0;
    const fail = message => { blocked = true; notice(message); };
    const stampOK = value => plain(value) && typeof value.writer === 'string' && integer(value.seq) && plain(value.deps) && Object.values(value.deps).every(integer);
    const rowState = (id,row) => ({...empty(), lessons:{[id]:row}});
    const attempt = (id,row) => row.progressAttempt || 'legacy:' + id + ':' + row.seed;
    const identity = (id,row) => condition(task(id,row.seed));
    const rowId = (id,row) => JSON.stringify([id,attempt(id,row)]);
    function recordOK(record) {
      return plain(record) && record.version === 1 && /^[a-f0-9]{32}$/.test(record.writer) && integer(record.seq) &&
        typeof record.generation === 'string' && (record.parent === null || typeof record.parent === 'string') &&
        (!record.base || valid(record.base)) && plain(record.rows) && Object.values(record.rows).every(entry => plain(entry) &&
          typeof entry.id === 'string' && valid(rowState(entry.id,entry.row)) && stampOK(entry.stamp) && stampOK(entry.selection)) &&
        Array.isArray(record.events) && record.events.length <= 6000 && record.events.every(event => plain(event) &&
          ['block','success','guided'].includes(event.type) && typeof event.id === 'string' && typeof event.attempt === 'string' &&
          typeof event.condition === 'string' && integer(event.seed) && stampOK(event.stamp) &&
          (event.type !== 'success' || typeof event.independent === 'boolean')) &&
        (!record.root || stampOK(record.root.stamp) && valid({...record.root.state,lessons:{}}));
    }
    function readAll() {
      const records=[];allRecords=records;let invalid=false;
      for(let i=0;i<storage.length;i++){
        const key=storage.key(i); if(!key || !key.startsWith(PREFIX)) continue;
        const text=storage.getItem(key); if(text === null) continue;
        if(text.length>4*1024*1024){unreadableRecords.push({key,text});invalid=true;continue;}
        let record;
        try{record=JSON.parse(text);if(!recordOK(record))throw Error('invalid recovery');}
        catch(error){unreadableRecords.push({key,text});invalid=true;continue;}
        records.push(record);
      }
      if(invalid||records.length>256)throw Error('invalid or large recovery');
      return records;
    }
    function readCopies() {
      const copies=[];olderPages=copies;let invalid=false;
      for(let i=0;i<storage.length;i++){
        const key=storage.key(i);if(!key?.startsWith(COPY_PREFIX))continue;
        const text=storage.getItem(key);let value;
        try{value=JSON.parse(text);if(!plain(value)||value.version!==1||typeof value.text!=='string'||value.text.length>5*1024*1024)throw Error('invalid older copy');}
        catch(error){unreadableRecords.push({key,text});invalid=true;continue;}
        copies.push(value);
      }
      if(invalid||copies.length>256)throw Error('invalid or large older copy');
      return copies;
    }
    function retainOlder(rawText,raw) {
      legacyCopy=clone(raw);
      if(olderPages.some(value=>value.text===rawText))return;
      if(olderPages.length>=256)throw Error('older copy limit');
      const value={version:1,text:rawText,generation:raw.progressStore?.generation||'initial'};
      // Keep the original bytes durably before replacing the old writer's
      // projection. If this write fails, the projection is left untouched.
      storage.setItem(COPY_PREFIX+writer+':'+(++copySerial),JSON.stringify(value));
      olderPages.push(value);
    }
    function activeGeneration(records) {
      const bases=records.filter(record=>record.base), parents=new Set(bases.map(record=>record.parent).filter(Boolean));
      const leaves=[...new Set(bases.map(record=>record.generation))].filter(id=>!parents.has(id));
      if(leaves.length>1) throw Error('concurrent imports');
      return leaves[0] || 'initial';
    }
    function combine(records, raw) {
      const selected=activeGeneration(records), current=records.filter(record=>record.generation===selected);
      const bases=current.filter(record=>record.base).map(record=>record.base);
      if(!bases.length) bases.push(raw || empty());
      const state=clone(bases[0]), baseline={}, entries=new Map(), events=[], roots=[];
      delete state.progressStore; delete state.recoveryDrafts;
      state.lessons={}; state.seen={}; state.runs=[]; state.active=null;
      const vector={};
      const addRow=(id,row,stamp=zero(),selection=zero(),fields={})=>{
        if(!stamp.writer)for(const field of draftFields){const value=fieldValue(row,field);if(value!==undefined)fields[field]={id:'baseline:'+id+':'+attempt(id,row)+':'+field+':'+digest({value}),value,stamp:zero(),supersedes:[],step:row.step};}
        const key=rowId(id,row), item={id,row:clone(row),stamp,selection,fields};
        if(!entries.has(key))entries.set(key,[]); entries.get(key).push(item);
      };
      for(const base of bases){
        for(const [id,row] of Object.entries(base.lessons)){
          const before=baseline[id];
          baseline[id]={independent:Math.max(before?.independent||0,row.independent),guided:Math.max(before?.guided||0,row.guided),
            checks:before && before.checks.length>row.checks.length ? before.checks : clone(row.checks)};
          addRow(id,row,zero(),row.progressSelection || zero());
        }
        roots.push({state:base,stamp:zero()});
      }
      for(const record of current){
        vector[record.writer]=Math.max(vector[record.writer]||0,record.seq);
        for(const entry of Object.values(record.rows))addRow(entry.id,entry.row,entry.stamp,entry.selection,entry.fields||{});
        events.push(...record.events);
        if(record.root)roots.push(record.root);
      }
      const baselineSeen=Object.assign({},...bases.map(base=>base.seen));
      const byAttempt=new Map(), choices=new Map(), recovery=bases.flatMap(base=>clone(base.recoveryDrafts||[])), fieldsByAttempt=new Map();
      for(const [key,list] of entries){
        const latest=list.reduce(choose,null), row=clone(latest.row), id=latest.id;
        row.progressAttempt=attempt(id,row); row.progressSelection=clone(latest.selection);
        const accepted=list.reduce((best,entry)=>entry.row.step>best.row.step?entry:best,latest);
        row.step=Math.max(...list.map(entry=>entry.row.step));
        for(const field of ['help','attempted','done'])row[field]=list.some(entry=>entry.row[field]===true);
        if(row.taskFirst){
          const ui=list.filter(entry=>entry.row.taskFirst).map(entry=>entry.row.taskFirst);
          row.taskFirst.mistakes=Math.max(0,...ui.map(value=>value.mistakes||0));
          if(accepted.row.taskFirst?.stepAnswers?.length>row.taskFirst.stepAnswers.length)
            row.taskFirst.stepAnswers=clone(accepted.row.taskFirst.stepAnswers);
        }
        const fieldCandidates={};
        for(const field of draftFields){
          const all=list.map(entry=>entry.fields[field]).filter(Boolean);
          const candidates=all.filter(entry=>!all.some(other=>other.id!==entry.id&&other.supersedes.includes(entry.id)));
          fieldCandidates[field]=candidates;
          const applicable=field==='taskFirst.stepDraft'?candidates.filter(entry=>entry.step===row.step):candidates;
          const winner=applicable.reduce(choose,null);if(winner)fieldSet(row,field,winner.value);else if(field==='taskFirst.stepDraft')fieldSet(row,field,'');
          if(field==='taskFirst.stepDraft')for(const entry of candidates.filter(entry=>entry.step!==row.step&&entry.value))
            recovery.push({lesson:id,attempt:row.progressAttempt,field:'pastStepDraft',step:entry.step,value:entry.value,source:entry.stamp.writer});
          const values=new Map();
          for(const entry of candidates){const value=entry.value;if(value!==undefined&&value!==null&&value!=='')values.set(JSON.stringify(value),{value,writer:entry.stamp.writer});}
          if(values.size>1)for(const {value,writer:source} of values.values())recovery.push({lesson:id,attempt:row.progressAttempt,field,value,source});
        }
        fieldsByAttempt.set(key,fieldCandidates);
        byAttempt.set(key,row);
        const selection={stamp:latest.selection,id,key};choices.set(id,choose(choices.get(id),selection));
      }
      const successes=new Map();
      for(const event of events.filter(event=>event.type==='success')){
        const key=JSON.stringify([event.id,event.attempt]);
        // A later disclosure is not evidence of assistance before this answer.
        // A concurrent/unknown blocker cannot establish independent work.
        const independent=event.independent&&!baselineSeen[event.condition]&&!events.some(block=>block.type==='block'&&
          block.id===event.id&&block.condition===event.condition&&!after(block.stamp,event.stamp));
        const old=successes.get(key);
        if(!old||independent&&!old.independent)successes.set(key,{...event,independent});
      }
      const independentConditions=new Map(), guidedAttempts=new Map();
      for(const success of successes.values())if(success.independent){
        if(!independentConditions.has(success.id))independentConditions.set(success.id,new Set());
        independentConditions.get(success.id).add(success.condition);
      }
      for(const event of events.filter(event=>event.type==='guided')){
        if(!guidedAttempts.has(event.id))guidedAttempts.set(event.id,new Set());guidedAttempts.get(event.id).add(event.attempt);
      }
      for(const [id,choice] of choices){
        const base=baseline[id]||{independent:0,guided:0,checks:[]};
        const history=[...successes.values()].filter(event=>event.id===id).sort((a,b)=>
          after(a.stamp,b.stamp)?1:after(b.stamp,a.stamp)?-1:a.stamp.writer.localeCompare(b.stamp.writer));
        const checks=base.checks.concat(history.map(event=>({seed:event.seed,correct:true,independent:event.independent})));
        for(const [key,row] of byAttempt)if(JSON.parse(key)[0]===id){
          row.independent=base.independent+(independentConditions.get(id)?.size||0);
          row.guided=base.guided+(guidedAttempts.get(id)?.size||0);
          row.checks=checks.slice(-100);
          const success=successes.get(key);
          if(success){
            row.done=true;row.attempted=true;
            if(row.taskFirst){
              row.taskFirst.feedback=success.independent?'Верно с первой попытки на новом варианте.':'Верно после помощи, повторного показа или исправления.';
              row.taskFirst.feedbackKind='good';
            }
          }
        }
        state.lessons[id]=clone(byAttempt.get(choice.key));
      }
      for(const [key,row] of byAttempt){
        const id=JSON.parse(key)[0];if(choices.get(id).key===key||row.done)continue;
        for(const field of ['taskFirst.finalDraft','taskFirst.stepDraft','note','taskFirst.model']){
          const value=fieldValue(row,field);if(value!==undefined&&value!==null&&value!=='')
            recovery.push({lesson:id,attempt:row.progressAttempt,seed:row.seed,condition:identity(id,row),field,value,source:'other-condition'});
        }
      }
      const latestRoot=roots.reduce(choose,null);state.serial=latestRoot.state.serial;
      const archives=new Map(), active=new Map(), examDrafts=new Map(), assisted=new Set();
      for(const item of roots){
        Object.assign(state.seen,item.state.seen);
        for(const draft of item.state.examDrafts||[])examDrafts.set(JSON.stringify(draft),clone(draft));
        for(const run of item.state.runs){const key=runKey(run),old=archives.get(key);if(run.assisted)assisted.add(key);if(!old||run.answers.length>old.run.answers.length||
          run.answers.length===old.run.answers.length&&after(item.stamp,old.stamp))archives.set(key,{run,stamp:item.stamp});}
        if(item.state.active){const run=item.state.active,key=runKey(run),old=active.get(key);if(run.assisted)assisted.add(key);if(!old||run.answers.length>old.run.answers.length||
          run.answers.length===old.run.answers.length&&after(item.stamp,old.stamp))active.set(key,{run,stamp:item.stamp});}
      }
      // A valid older page may have shown help while every new page was closed.
      // Remember its exposed conditions for FUTURE answers only: archived old
      // snapshots never increase counters or rewrite already accepted credit.
      for(const copy of olderPages){
        const prior=decode(copy.text);
        if(!valid(prior)||(copy.generation||prior.progressStore?.generation||'initial')!==selected)continue;
        Object.assign(state.seen,prior.seen);
        for(const [id,row] of Object.entries(prior.lessons))if(row.help||row.attempted)state.seen[identity(id,row)]=true;
      }
      state.runs=[...archives.values()].map(value=>({...clone(value.run),assisted:assisted.has(runKey(value.run))})).slice(-200);
      const pending=[...active.entries()].filter(([key])=>!archives.has(key)).map(([,value])=>value);
      if(pending.length>1)throw Error('concurrent active runs');
      state.active=pending.length?{...clone(pending[0].run),assisted:assisted.has(runKey(pending[0].run))}:null;
      state.examDrafts=[...examDrafts.values()];state.recoveryDrafts=recovery.concat(state.examDrafts);
      if(!valid(state))throw Error('invalid merged state');
      return {state,byAttempt,fieldsByAttempt,vector,generation:selected,records:current,baselineSeen};
    }
    function scan(importing=false) {
      const rawText=storage.getItem(KEY);let records,raw=null,wire=null;
      let failed;
      try{records=readAll();}catch(error){failed=error;}
      try{readCopies();}catch(error){failed=failed||error;}
      if(failed){legacyCopy={unreadable:rawText};throw failed;}
      try{wire=rawText===null?null:JSON.parse(rawText);raw=rawText===null?null:decode(rawText);if(raw!==null&&(!valid(raw)||raw.progressStore&&raw.progressStore.version!==1))throw Error('invalid v1');}
      catch(error){legacyCopy=raw||{unreadable:rawText};if(records.length)lastScan=combine(records,null);throw error;}
      let result=combine(records,raw);
      if(!importing&&records.length&&raw && (!raw.progressStore&&!records.some(record=>record.base&&same(raw,record.base)) || raw.progressStore&&(
        raw.progressStore.generation!==result.generation || raw.progressStore.digest!==digest(wire)))){
        retainOlder(rawText,raw);
        // Unknown older writers retain a downloadable copy. They never become
        // new independent evidence or replace the protected history.
        notice('Другая версия страницы записала прежнюю копию. Подтверждённая работа восстановлена; обе копии доступны для скачивания.');
        result=combine(records,raw);
      }
      result.needsProjection=!raw?.progressStore||!same(raw.progressStore.vector,result.vector)||raw.progressStore.digest!==digest(wire);
      result.sourceBase=raw;
      lastScan=result;
      return result;
    }
    function initOwn(result) {
      if(own)return;
      own={version:1,writer,generation:result.generation,parent:null,seq:0,base:pendingBase,rows:{},events:[],root:null};
    }
    function observe() {
      if(blocked)return lastScan;
      try{
        const result=scan();
        if(result.generation!==generation){fail('В другой вкладке восстановлена другая копия курса. Эта вкладка больше не записывает изменения. Скачай свою работу и перезагрузи страницу.');return lastScan;}
        return result;
      }catch(error){fail('Сохранение недоступно, повреждено или относится к другой версии. Исходные данные не изменены. Скачай текущую работу и копии восстановления.');return lastScan;}
    }
    function apply(state,result) {
      if(!result)return;
      const dirtySerial=previous&&state.serial!==previous.serial;
      Object.assign(state.seen,result.state.seen);
      if(!dirtySerial)state.serial=result.state.serial;
      for(const [id,remote] of Object.entries(result.state.lessons)){
        const local=state.lessons[id];if(!local){state.lessons[id]=clone(remote);continue;}
        const match=result.byAttempt.get(rowId(id,local)),wasDone=!!local.done;
        local.independent=remote.independent;local.guided=remote.guided;local.checks=clone(remote.checks);
        if(!match)continue;
        local.progressAttempt=attempt(id,local);local.progressSelection=clone(match.progressSelection);
        if(match.step>local.step&&local.taskFirst)local.taskFirst.stepDraft=match.taskFirst?.stepDraft||'';
        local.step=Math.max(local.step,match.step);
        for(const field of ['help','attempted','done'])local[field]=!!local[field]||!!match[field];
        if(local.taskFirst&&match.taskFirst){
          local.taskFirst.mistakes=Math.max(local.taskFirst.mistakes||0,match.taskFirst.mistakes||0);
          if(match.taskFirst.stepAnswers.length>local.taskFirst.stepAnswers.length)local.taskFirst.stepAnswers=clone(match.taskFirst.stepAnswers);
          if(match.done&&local.taskFirst.feedback?.startsWith('Верно с первой')&&match.taskFirst.feedback?.startsWith('Верно после'))local.taskFirst.feedback=match.taskFirst.feedback;
          if(match.done&&!wasDone){local.taskFirst.feedback='Этот вариант уже проверен в другой вкладке. Твоя запись сохранена.';local.taskFirst.feedbackKind='good';}
        }
      }
      if(!previous||same(state.active,previous.active)){
        if(state.active&&result.state.active&&runKey(state.active)===runKey(result.state.active))Object.assign(state.active,clone(result.state.active));
        else state.active=clone(result.state.active);
      }
      const archived=new Map(result.state.runs.map(run=>[runKey(run),run]));
      for(const run of state.runs)if(!archived.has(runKey(run)))archived.set(runKey(run),run);
      state.runs=[...archived.values()].slice(-200);
      if(state.active&&archived.has(runKey(state.active)))state.active=null;
      state.recoveryDrafts=clone(result.state.recoveryDrafts);
      state.examDrafts=clone(result.state.examDrafts);
    }
    function project(result) {
      const value=encode(result.state);
      value.progressStore={version:1,generation:result.generation,vector:result.vector,digest:digest(value)};
      storage.setItem(KEY,JSON.stringify(value));
    }
    function save(state) {
      if(blocked)return false;
      const before=previous || empty(), changed=Object.entries(state.lessons).filter(([id,row])=>!same(row,before.lessons[id]));
      const rootChanged=!same({serial:state.serial,seen:state.seen,runs:state.runs,active:state.active,examDrafts:state.examDrafts},
        {serial:before.serial,seen:before.seen,runs:before.runs,active:before.active,examDrafts:before.examDrafts});
      const result=observe();if(blocked||!result)return false;
      if(!changed.length&&!rootChanged){
        try{if(result.needsProjection&&result.records.length)project(result);}catch(error){fail('Не удалось сохранить общую копию. Скачай текущую работу перед перезагрузкой.');return false;}
        apply(state,result);previous=clone(state);return true;
      }
      initOwn(result);
      const stamp={writer,seq:++sequence,deps:clone(result.vector)};
      for(const [id,row] of changed){
        const old=before.lessons[id], aid=attempt(id,row), cond=identity(id,row), key=rowId(id,row);
        const event=(type,extra={})=>own.events.push({type,id,attempt:aid,condition:cond,seed:row.seed,stamp:clone(stamp),...extra});
        const oldSame=old&&attempt(id,old)===aid;
        if(row.help&&(!oldSame||!old.help)||(row.taskFirst?.mistakes||0)>(oldSame?old.taskFirst?.mistakes||0:0))event('block');
        if(row.done&&(!oldSame||!old.done)&&row.checks?.length){
          const check=row.checks.at(-1);if(check.correct===true&&check.seed===row.seed)event('success',{independent:check.independent===true});
        }
        if(row.guided>(old?.guided||0))event('guided');
        row.progressAttempt=aid;
        if(!row.progressSelection)row.progressSelection=zero();
        const fields=clone(own.rows[key]?.fields||{});
        for(const field of draftFields){
          const value=fieldValue(row,field), oldValue=oldSame?fieldValue(old,field):undefined;
          if(value===undefined||oldSame&&same(value,oldValue))continue;
          const supersedes=new Set(fields[field]?.supersedes||[]);if(fields[field])supersedes.add(fields[field].id);
          for(const candidate of result.fieldsByAttempt.get(key)?.[field]||[])if(same(candidate.value,oldValue)){
            supersedes.add(candidate.id);for(const id of candidate.supersedes)supersedes.add(id);
          }
          fields[field]={id:writer+':'+sequence+':'+field,value:clone(value),stamp:clone(stamp),supersedes:[...supersedes],step:row.step};
        }
        own.rows[key]={id,row:clone(row),stamp:clone(stamp),selection:clone(row.progressSelection),fields};
      }
      if(rootChanged)own.root={state:{...clone(state),lessons:{},recoveryDrafts:[]},stamp:clone(stamp)};
      own.seq=sequence;
      try{
        if(!recordOK(own))throw Error('recovery limit');
        const text=JSON.stringify(own);if(text.length>4*1024*1024)throw Error('recovery limit');
        // Only this document writes this key. Concurrent documents may replace
        // the compatibility projection, never one another's recovery evidence.
        storage.setItem(PREFIX+writer,text);pendingBase=null;
        const merged=scan();
        if(merged.generation!==generation){fail('В другой вкладке восстановлена другая копия курса. Твоя запись сохранена отдельно. Скачай все копии и перезагрузи страницу.');return false;}
        project(merged);apply(state,merged);previous=clone(state);return true;
      }catch(error){fail('Не удалось сохранить работу в браузере. Подтверждённые копии не удалены. Скачай текущую работу и копии восстановления.');return false;}
    }
    function sync(state) {
      const result=observe();if(blocked)return false;
      // Commit local input first, then reconcile the exact mounted attempt.
      if(previous&&!same(state,previous))return save(state);
      apply(state,result);previous=clone(state);return true;
    }
    function fresh(row) {
      const result=observe();if(blocked)return false;
      row.progressAttempt=writer+':attempt:'+String(sequence+1)+':'+String((root.crypto?.getRandomValues(new Uint32Array(1))||[0])[0]);
      row.progressSelection={writer,seq:sequence+1,deps:clone(result.vector)};return true;
    }
    function replace(value) {
      if(!valid(value))return false;
      const current=observe();if(blocked)return false;
      const next=writer+':import:'+String(sequence+1), base=clone(value);delete base.progressStore;
      for(const row of Object.values(base.lessons)){delete row.progressAttempt;delete row.progressSelection;}
      own={version:1,writer,generation:next,parent:current.generation,seq:++sequence,base,rows:{},events:[],root:null};
      let committed=false;
      try{
        const retained=storage.getItem(PREFIX+writer);if(retained)storage.setItem(PREFIX+writer+':before-import:'+String(sequence),retained);
        storage.setItem(PREFIX+writer,JSON.stringify(own));committed=true;generation=next;pendingBase=null;const result=scan(true);project(result);previous=clone(result.state);return clone(result.state);
      }
      catch(error){
        if(committed){
          let restored=clone(base);
          try{allRecords=readAll();const result=combine(allRecords,base);lastScan=result;restored=clone(result.state);}catch{/* The committed input remains in its own record and in the download. */}
          previous=clone(restored);fail('Копия сохранена для восстановления, но общая запись недоступна. Скачай все копии перед продолжением.');return restored;
        }
        fail('Копия не восстановлена: сохранить её не удалось. Прежняя история и загруженный файл не удалены.');return false;
      }
    }
    function recovery(state) {
      return {format:'mathexam.ege-baza.path.recovery',version:1,current:encode(clone(state)),
        protected:lastScan?encode(clone(lastScan.state)):null,olderPage:legacyCopy,olderPages:clone(olderPages),
        records:clone(allRecords),unreadableRecords:clone(unreadableRecords),pending:own};
    }
    let initial=empty();
    try{
      storage=root.localStorage;
      const random=new Uint32Array(4);root.crypto.getRandomValues(random);writer=Array.from(random,x=>x.toString(16).padStart(8,'0')).join('');
      const result=scan();generation=result.generation;initial=clone(result.state);
      pendingBase=result.records.some(record=>record.base)?null:clone(result.sourceBase||initial);
      previous=clone(initial);
      if(result.records.length)project(result);
    }catch(error){if(lastScan)initial=clone(lastScan.state);fail('Сохранение недоступно или повреждено. Исходные данные оставлены без изменений. Текущую работу можно скачать.');previous=clone(initial);}
    return {initial,save,sync,fresh,replace,recovery,isWritable:()=>!blocked,
      handleStorage(event,state){if(event.key===KEY||event.key?.startsWith(PREFIX)||event.key?.startsWith(COPY_PREFIX)){
        const result=observe();if(!blocked){
          try{if(result.needsProjection&&result.records.length)project(result);}catch(error){fail('Не удалось сохранить общую копию. Скачай текущую работу перед перезагрузкой.');}
          apply(state,result);previous=clone(state);
        }
      }}};
  }
  root.PathProgressStore=Object.freeze({create,digest,validExtras,KEY,PREFIX,COPY_PREFIX});
})(typeof window==='object'?window:globalThis);

(function(){'use strict';if(new URLSearchParams(location.search).get('learning')==='1')return;const D=PathData,$=s=>document.querySelector(s),root=$('#main'),KEY='mathexam.ege-baza.path.v1',E=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));let mountedTaskFirst=null,writable=true,state={version:1,serial:11,lessons:{},seen:{},runs:[],active:null};
const M=text=>PathPracticeView.math(text);
const integer=(n,max=1e9)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
const answerOK=a=>a&&D.meta.some(m=>m.id===a.id)&&integer(a.seed)&&typeof a.value==='string'&&a.value.length<10000&&typeof a.correct==='boolean';
const runOK=r=>r&&['exam','diagnostic'].includes(r.kind)&&Array.isArray(r.ids)&&r.ids.length===21&&r.ids.every(id=>D.meta.some(l=>l.id===id))&&Array.isArray(r.answers)&&r.answers.length<=21&&r.answers.every(answerOK)&&integer(r.seed)&&integer(r.i,21)&&Number.isFinite(r.start)&&(r.draft===undefined||typeof r.draft==='string'&&r.draft.length<=10000);
function valid(x){return x&&x.version===1&&integer(x.serial)&&x.lessons&&typeof x.lessons==='object'&&!Array.isArray(x.lessons)&&x.seen&&typeof x.seen==='object'&&!Array.isArray(x.seen)&&Object.keys(x.seen).length<20000&&Object.values(x.seen).every(v=>v===true)&&Array.isArray(x.runs)&&x.runs.length<=200&&x.runs.every(runOK)&&Object.entries(x.lessons).every(([k,l])=>D.meta.some(m=>m.id===k)&&l&&integer(l.seed)&&integer(l.stage,4)&&integer(l.step,20)&&integer(l.independent)&&integer(l.guided)&&typeof l.note==='string'&&l.note.length<=10000&&typeof l.draft==='string'&&l.draft.length<=10000&&typeof l.help==='boolean'&&typeof l.attempted==='boolean'&&Array.isArray(l.checks)&&(!window.PathTaskFirst||PathTaskFirst.valid(l.taskFirst)))&&(!x.active||runOK(x.active))&&PathProgressStore.validExtras(x);}

function readProgress(raw){const value=JSON.parse(raw);return D.practice?.expandTask21Progress?.(value)??value;}
function writeProgress(value){return D.practice?.packTask21Progress?.(value)??value;}
function notice(t){$('#storage').hidden=false;$('#storage').textContent=t;}
const progress=window.PathProgressStore?.create({valid,decode:readProgress,encode:writeProgress,task:(id,seed)=>D.task(id,seed),condition:taskKey,
 empty:()=>({version:1,serial:11,lessons:{},seen:{},runs:[],active:null}),notice});
if(progress){state=progress.initial;writable=progress.isWritable();}else{writable=false;notice('Обнови страницу, чтобы продолжить с сохранением работы.');}
function recoveryUI(){
 const drafts=state.recoveryDrafts||[],recover=progress?.recovery(state);
 let panel=$('#pathRecovery');
 if(!drafts.length&&writable&&!recover?.olderPage&&!recover?.olderPages?.length){panel?.remove();return;}
 if(!panel){panel=document.createElement('details');panel.id='pathRecovery';panel.className='panel';$('#storage').insertAdjacentElement('afterend',panel);}
 const labels={draft:'Ответ',note:'Объяснение','taskFirst.finalDraft':'Ответ','taskFirst.stepDraft':'Черновик шага','taskFirst.model':'Настройки модели',examDraft:'Черновик ответа в проверке',pastStepDraft:'Черновик уже пройденного шага'};
 panel.innerHTML='<summary>Сохранённые копии работы</summary><p>Текущие поля остаются на месте. Здесь можно скопировать записи из другой вкладки.</p>'+drafts.map((draft,index)=>'<label for="recovery-'+index+'">'+E(D.meta.find(meta=>meta.id===draft.lesson)?.title||draft.lesson)+' · '+E(labels[draft.field]||'Запись')+(Number.isInteger(draft.step)?' '+(draft.step+1):'')+(draft.condition?' · '+E(draft.condition):'')+'</label><textarea readonly id="recovery-'+index+'" rows="2"></textarea>').join('')+'<button type="button" id="downloadRecovery">Скачать все копии</button>';
 drafts.forEach((draft,index)=>{$('#recovery-'+index).value=typeof draft.value==='string'?draft.value:JSON.stringify(draft.value);});
 $('#downloadRecovery').onclick=()=>downloadJSON(progress?progress.recovery(state):state,'EGE_baza_recovery.json');
}
function save(){if(writable&&progress&&!progress.save(state))writable=false;recoveryUI();}
function retainStepDraft(id,seed,step,value){state.examDrafts=(state.examDrafts||[]).concat({lesson:id,attempt:'step:'+id+':'+seed+':'+step,field:'pastStepDraft',step,value});save();}
function reconcile(){if(!writable||!progress)return false;const ok=progress.sync(state);if(!ok)writable=false;recoveryUI();return ok;}
function lesson(id){return state.lessons[id]||(state.lessons[id]={seed:id==='equations'?10:state.serial++,stage:0,step:0,help:false,attempted:false,independent:0,guided:0,note:'',draft:'',checks:[]});}
function setHash(s){location.hash=s;}
function feedback(s,bad=false){let f=$('#feedback');if(f){f.innerHTML=M(s);f.className='feedback '+(bad?'bad':'good');}}
function taskKey(t){if(t.geometryRebuild===true)return JSON.stringify([t.q,t.model?.diagram||null,(t.choices||[]).map(choice=>choice.label).sort()]);return !t.display&&!t.choices?t.q:JSON.stringify([t.q,t.display||null,(t.labels||[]).slice().sort(),(t.choices||[]).slice().sort()]);}
function seen(t){return !!state.seen[t.q]||!!state.seen[taskKey(t)];}function expose(t){state.seen[taskKey(t)]=true;}
const initialHeader=document.querySelector('header').innerHTML,initialFooter=document.querySelector('footer').innerHTML;
const grade7Subjects={algebra:'Алгебра',geometry:'Геометрия',foundation:'Базовая математика'};
function courseChrome(meta){const grade7=!!meta?.grade7,header=document.querySelector('header'),footer=document.querySelector('footer');if(grade7){header.innerHTML='<strong>MathExam · 7 класс</strong><nav aria-label="Учебная навигация"><a class="btn" href="../../grade7/">Мой курс · 7 класс</a><a class="btn" href="#grade7">Все тренажёры курса</a><a class="btn" href="https://mathexam-board-ladynata.msk1.amvera.tech/learning/#route">Мой кабинет</a><a class="btn" href="#report">Работа в этом браузере</a></nav>';footer.innerHTML='<p>Авторские задания для 7 класса и повторения основ. Для общей истории и сдачи преподавателю открывай задания в своём кабинете. На этой отдельной странице результаты сохраняются только в текущем браузере.</p>';if(meta.geometryRebuild){header.querySelector('nav').insertAdjacentHTML('afterbegin','<a class="btn" href="../../grade7/geometry-rebuild/">Сначала понятно · все темы</a>');}}else if(header.innerHTML!==initialHeader){header.innerHTML=initialHeader;footer.innerHTML=initialFooter;}}
function grade7Map(){courseChrome({grade7:true});document.title='7 класс и основы · MathExam';const subjects=[...Object.entries(grade7Subjects),['pre7','Основы до 7 класса']];root.innerHTML='<p class="eyebrow">МОЖНО ИДТИ В СВОЁМ ТЕМПЕ</p><h1>Алгебра, геометрия и основы</h1><p class="lead">Выбирай любую тему. Посмотри модель, пройди шаги и проверь себя на новом примере.</p><p><a class="btn primary" href="https://mathexam-board-ladynata.msk1.amvera.tech/learning/#route">Заниматься с сохранением в кабинете →</a> <a class="btn" href="../../grade7/">Курс, шпаргалки и видео →</a></p><div class="cards">'+subjects.map(([subject,title])=>'<section class="card"><h2>'+title+'</h2><ul class="trainer-list">'+D.meta.filter(m=>m.grade7&&(subject==='pre7'?m.pre7:!m.pre7&&m.subject===subject)).map(m=>'<li><a href="#lesson='+m.id+'">'+E(m.title)+'</a></li>').join('')+'</ul></section>').join('')+'</div>'; }
const stageLabels=['Понять','Исследовать','Решить по шагам','Самостоятельно','Объяснить'];
function fresh(id,stage=3){
 if(!reconcile())return;
 const l=lesson(id),meta=D.meta.find(m=>m.id===id),ege=meta&&!meta.grade7&&!meta.pre7,previous=ege?D.task(id,l.seed):null;
 const takeSeed=()=>{if(!ege)return state.serial++;const seed=state.serial;state.serial=seed>=1e9?11:seed+1;return seed;};
 l.seed=takeSeed();
 if(ege){
  const limit=D.equationPractice?.has(id)?D.equationPractice.count:256;
  for(let n=1;n<limit&&(seen(D.task(id,l.seed))||taskKey(D.task(id,l.seed))===taskKey(previous));n++)l.seed=takeSeed();
  // Finite banks may only offer the same condition. A changed seed alone is not a new task.
  if(taskKey(D.task(id,l.seed))===taskKey(previous))expose(D.task(id,l.seed));
 }
 if(ege)delete l.taskFirst; // A fresh attempt resets its UI even when the bounded serial reuses the same seed.
 l.stage=stage;l.step=0;l.help=false;l.attempted=false;l.draft='';l.done=false;progress.fresh(l);save();render();
}
const positionNames=['Покупки и округление','Величины и единицы','Таблицы и диаграммы','Вычисления по формулам','Вероятность','Выбор по условиям','Графики и изменение','Логические выводы','Геометрия на сетке','Практическая геометрия','Объёмы и поверхности','Планиметрия','Стереометрия','Числа и дроби','Проценты и отношения','Выражения и функции','Уравнения','Числа, неравенства и ось','Цифры и делимость','Текстовые задачи','Рассуждения и целые числа'];
function map(){
 root.innerHTML='<p class="eyebrow">Тренажёры базового ЕГЭ</p><h1>21 позиция.<br>Начни с нужного навыка.</h1><p class="lead">В каждой теме — смысл, модель, решение по шагам и новый вариант для самостоятельной работы. Открой позицию, чтобы выбрать конкретный тип задачи.</p><div class="actions"><a class="btn primary" href="../reference/index.html">Справочник с тренажёрами</a><a class="btn" href="#foundation">Дроби → проценты → пропорции</a><a class="btn" href="#diagnostic">Определить пробелы</a><a class="btn" href="#exam">Пробная работа · 21 задание</a><a class="btn" href="../work-rate/index.html">Землекопы</a></div><label>Найти тему <input id="search" type="search" placeholder="Например: скидка, логарифм, трапеция"></label><p class="muted">'+D.meta.filter(m=>!m.grade7).length+' тематических тренажёра. Это авторские семейства задач, а не полный открытый банк ФИПИ.</p><div id="cards" class="cards"></div>';
 const cards=q=>{$('#cards').innerHTML=positionNames.map((name,i)=>{const items=D.meta.filter(m=>m.pos===i+1&&(!q||(m.title+' '+m.idea+' '+m.pos).toLowerCase().includes(q.toLowerCase())));if(!items.length)return '';return `<section class="card"><span class="badge">Задание ${i+1}</span><h2>${name}</h2><details ${q?'open':''}><summary>${items.length} типов задач — выбрать</summary><ul class="trainer-list">${items.map(m=>{const l=state.lessons[m.id];return `<li><a href="#lesson=${m.id}">${E(m.title)}</a>${l?`<small>Самостоятельно: ${l.independent||0}; разборов: ${l.guided||0}</small>`:''}</li>`;}).join('')}</ul></details></section>`;}).join('')||'<p>Ничего не найдено. Попробуй «дроби», «площадь» или номер задания.</p>';};cards('');$('#search').oninput=e=>cards(e.target.value);
}
function foundation(){
 root.innerHTML='<a href="#map">← Все тренажёры</a><p class="eyebrow">Общий маршрут для школьной математики и ЕГЭ</p><h1>Дроби. Проценты. Пропорции.</h1><p class="lead">Начни с первого непонятного шага. Если умеешь решать без подсказок, переходи дальше. Завершение разбора — подготовка, самостоятельное новое решение — отдельный результат.</p><ol class="foundation-route">'+D.practice.foundation.map(id=>{let m=D.meta.find(x=>x.id===id),l=state.lessons[id];return `<li><h2><a href="#lesson=${id}">${E(m.title)}</a></h2><p>${E(m.idea)}</p><span>${l?`Самостоятельно: ${l.independent||0}. Разборов: ${l.guided||0}.`:'Ещё не открывали.'}</span></li>`;}).join('')+'</ol><div class="actions"><a class="btn" href="../algebra/index.html#base">Базовые действия</a><a class="btn" href="../percent/index.html">Лаборатория процентов</a><a class="btn primary" href="#report">Мои результаты</a></div>';
}
function support(t,omitVisual=false){return window.PathPracticeView?PathPracticeView.markup(t,omitVisual):'';}
function remediationId(meta){if(!meta.expanded)return meta.id;return ({fractions:'fractions',fraction:'share',decimals:'fractions',percent:'choice',change:'percent',proportion:'ratio',division:'ratio',equations:'equations',powers:'powers',signs:'numberline'})[meta.gap]||meta.id;}
function equationPracticeLinks(id){if(id!=='equations'&&!D.equationPractice?.has(id))return '';return `<section class="panel equation-practice-menu"><h2>Потренироваться на похожих уравнениях</h2><p>Четыре набора по 240 разных условий. Выбери один тип: новые варианты останутся линейными уравнениями этого типа.</p><div class="actions">${D.equationPractice.families.map(m=>`<a class="btn ${id===m.id?'primary':''}" href="#lesson=${m.id}" ${id===m.id?'aria-current="page"':''}>${E(m.title)}</a>`).join('')}</div>${D.equationPractice.has(id)?'<p>Кнопки «Ещё по шагам» и «Ещё задача этого типа» дают новое условие выбранного типа. После 240 показанных условий начнутся повторы; они не добавляют новых самостоятельных успехов.</p>':''}</section>`;}
function fractionPracticeLink(id){return ['fractions','practice-fraction-expression'].includes(id)?'<section class="panel fraction-extra-practice"><h2>Ещё выражения с дробями</h2><p>Скобки и порядок действий: решай новые примеры по одному шагу.</p><a class="btn" href="https://mathexam.space/school/index.html?course=vilenkin6#lesson/v6f-fraction-order" target="_blank" rel="noopener">Открыть тренировку →</a><p>Она откроется в другой вкладке. Эта работа останется здесь.</p></section>':'';}
function showLesson(id){const meta=D.meta.find(m=>m.id===id);if(!meta)return map();courseChrome(meta);let l=lesson(id),t=D.task(id,l.seed);if(l.step>t.steps.length)l.step=0;document.title=meta.title+(meta.grade7?' · 7 класс':' · ЕГЭ база');if(!meta.grade7&&!meta.pre7&&window.PathTaskFirst){mountedTaskFirst=PathTaskFirst.mount(root,{meta,task:t,lesson:l,save,reconcile,retainStepDraft,seen,expose,fresh,setHash,remediationId,equationPracticeLinks,fractionPracticeLink,learningCycle:true,journey:window.EgeBazaExamMap?{line:EgeBazaExamMap.forLesson(id),next:EgeBazaExamMap.nextLesson(id)}:window.EgeBazaJourney?{line:EgeBazaJourney.lineForLesson(id),next:EgeBazaJourney.nextLesson(id)}:null});return;}if(PathPracticeView.photoProof?.supports(t)){showPhotoProof(id,t,l);return;}const source=meta.grade7?'<p class="source">Авторская практика для 7 класса: свои условия, пошаговый разбор и новые варианты. <a href="../../grade7/">Вернуться к курсу</a>.</p>':`<p class="source">Связь: базовый ЕГЭ, позиция ${meta.pos}. Задача авторская. <a href="../sources/index.html#p${meta.pos}">Что сверено с ФИПИ</a>.</p>`;
root.innerHTML=`<a href="${meta.grade7?'#grade7':'#map'}">← Все темы</a><p class="eyebrow">${meta.pre7?'Основы до 7 класса':meta.grade7?'7 класс · '+grade7Subjects[meta.subject]:'Задание '+meta.pos}</p><h1>${E(meta.title)}</h1><label>${meta.grade7?'Тема для тренировки':'Тип задачи в этой позиции'} <select id="typeSelect">${D.meta.filter(m=>meta.grade7?m.grade7&&!!m.pre7===!!meta.pre7&&m.subject===meta.subject:m.pos===meta.pos).map(m=>`<option value="${m.id}" ${m.id===id?'selected':''}>${E(m.title)}</option>`).join('')}</select></label><nav class="stage-nav" aria-label="Шаги урока">${(meta.geometryRebuild?['Главная идея','Мастерская','По шагам','Мой ответ','Объясняю']:stageLabels).map((s,i)=>`<button data-stage="${i}" ${i===l.stage?'aria-current="step"':''}>${i+1}. ${s}</button>`).join('')}</nav>${meta.geometryRebuild&&[2,3].includes(l.stage)?'<aside class="geometry-entry" aria-label="Как пройти задание"><strong>Одна задача — маленькая миссия</strong><p>Впервые здесь? Найди элементы на рисунке и собери рассуждение. Ошибки можно исправлять, подсказки — брать без штрафа.</p><button type="button" class="primary" data-geometry-explore>Сначала в мастерскую</button></aside>':''}<div id="lesson"></div>${equationPracticeLinks(id)}${fractionPracticeLink(id)}${id==='motion'?'<p class="callout">Ещё один вид текстовых задач: <a href="../work-rate/index.html">землекопы и совместная работа без уравнений</a>.</p>':''}${source}`;
$('#typeSelect').onchange=e=>setHash('lesson='+e.target.value);root.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{let n=+b.dataset.stage;if(n===3&&l.stage!==3){fresh(id,3);return;}l.stage=n;if(n<3){l.help=true;expose(t);}save();render();});let box=$('#lesson');
if(meta.geometryRebuild&&$('[data-geometry-explore]'))$('[data-geometry-explore]').onclick=()=>{l.stage=1;l.help=true;save();render();};
if(l.stage===0){expose(t);box.innerHTML=`<section class="panel"><h2>Главная идея</h2><p class="lead">${M(meta.idea)}</p><div class="callout"><b>Перед вычислением спроси себя</b><p>${(id==='equations'||D.equationPractice?.has(id))?'Что именно я переношу: слагаемое или множитель? Почему равенство останется верным?':'Что дано, что неизвестно и какая связь между ними? Какие единицы нужны в ответе?'}</p></div><p class="task">${M(t.q)}</p>${support(t)}<button class="primary" id="next">Исследовать модель →</button></section>`;$('#next').onclick=()=>{l.stage=1;save();render();};}
if(l.stage===1){expose(t);l.help=true;box.innerHTML=`<section class="panel"><p class="task">${M(t.q)}</p>${support(t,['polygon-build','pre7-lab','grade7-construction'].includes(t.model.kind))}${t.model.expansion?`<p class="callout">${M(t.model.expansion)}</p>`:''}<div id="model"></div><button id="next" class="primary">Перейти к решению →</button></section>`;PathModels.mount($('#model'),t);$('#next').onclick=()=>{l.stage=2;save();render();};}
if(l.stage===2){expose(t);box.innerHTML=`<section class="panel"><p class="task">${M(t.q)}</p>${support(t)}<ol class="steps">${t.steps.slice(0,l.step).map(s=>`<li>${M(s.q)} <b>${M(s.a===undefined?'Условия выполнены':PathPracticeView.answerText(s))}</b><br>${M(s.why)}</li>`).join('')}</ol>${l.step<t.steps.length?`<div class="callout"><b>Шаг ${l.step+1}/${t.steps.length}</b><p>${M(t.steps[l.step].q)}</p></div>${answerForm(t.steps[l.step])}<button id="hint">Подсказать смысл шага</button><p id="hintText"></p>`:'<h2>Разбор завершён</h2><p>Теперь реши новый вариант, выбрав способ самостоятельно.</p><button id="new" class="primary">Новый самостоятельный вариант</button>'}${(id==='equations'||D.equationPractice?.has(id))?'<button id="moreGuided">Ещё по шагам: похожее уравнение</button>':''}<p id="feedback" class="feedback" role="status"></p><details id="gap"><summary>Мешает пробел в основе?</summary><p>Откройте нужный навык; эта вкладка сохраняет текущий шаг. После тренировки вернитесь сюда.</p><a class="btn" href="#foundation">Маршрут: дроби, проценты, пропорции</a><a class="btn" target="_blank" rel="noopener" href="../algebra/index.html">Знаки, дроби и действия</a> <a class="btn" target="_blank" rel="noopener" href="../percent/index.html">Проценты и пропорции</a></details></section>`;if($('#answerForm')){$('#answer').value=l.draft||'';PathPracticeView.bindChoices(root,value=>{l.draft=value;save();});$('#answer').oninput=e=>{l.draft=e.target.value.slice(0,10000);save();};$('#answerForm').onsubmit=e=>{e.preventDefault();if(!$('#answer').value.trim())return feedback('Сначала введи ответ.',true);let s=t.steps[l.step];if(D.correct(s,$('#answer').value)){l.step++;l.draft='';if(l.step===t.steps.length)l.guided=(l.guided||0)+1;save();render();$('#answer')?.focus();}else{l.help=true;save();feedback(PathPracticeView.wrongFeedback(s,$('#answer').value,'Проверь именно этот шаг. '+s.why),true);EgeRemediation.show({id:remediationId(meta),value:$('#answer').value,expected:s.a});}};$('#hint').onclick=()=>{l.help=true;$('#hintText').innerHTML=M(t.steps[l.step].why);save();};}else $('#new').onclick=()=>fresh(id);if($('#moreGuided'))$('#moreGuided').onclick=()=>{const target=id==='equations'?'equations-linear':id;if(target!==id)setHash('lesson='+target);fresh(target,2);};$('#gap').ontoggle=()=>{if($('#gap').open){l.help=true;save();}};}
if(l.stage===3){box.innerHTML=`<section class="panel"><span class="badge">${t.geometryRebuild ? (id.startsWith('grade7-r-photo-proof-') ? 'Мой ответ по рисунку' : 'Мой ответ') : 'Новый вариант · без открытого разбора'}</span><p class="task">${M(t.q)}</p>${support(t)}${answerForm(t)}<p id="feedback" class="feedback" role="status"></p><div class="actions"><button id="explain">Разобрать этот вариант</button><button id="new">Другие числа</button><button id="next">Объяснить своими словами →</button></div><p class="muted">Засчитывается первая верная попытка без подсказки на ранее не показанном условии. Повтор и исправление полезны, но отмечаются отдельно.</p></section>`;$('#answer').value=l.draft||'';PathPracticeView.bindChoices(root,value=>{l.draft=value;save();});$('#answer').oninput=e=>{l.draft=e.target.value.slice(0,10000);save();};$('#answerForm').onsubmit=e=>{e.preventDefault();const v=$('#answer').value;if(!v.trim())return feedback('Сначала введи ответ.',true);if(l.done)return feedback('Этот вариант уже проверен. Возьми другие числа.');const ok=D.correct(t,v),clean=!l.attempted&&!l.help&&!seen(t);l.attempted=true;expose(t);if(ok){l.done=true;if(clean)l.independent=(l.independent||0)+1;l.checks=(l.checks||[]).concat({seed:l.seed,correct:true,independent:clean}).slice(-100);feedback(clean?'Верно с первой попытки на новом варианте.':'Верно после помощи, повторного показа или исправления.');}else{l.help=true;feedback(PathPracticeView.wrongFeedback(t,v,'Пока неверно. Проверь знак, единицы и то, что спрашивается. Можно разобрать этот вариант по шагам.'),true);EgeRemediation.show({id:remediationId(meta),value:v,expected:t.answer});}save();};$('#explain').onclick=()=>{l.help=true;l.stage=2;expose(t);save();render();};$('#new').onclick=()=>fresh(id);$('#next').onclick=()=>{l.stage=4;save();render();};}
if(l.stage===4){box.innerHTML=`<section class="panel"><h2>Объясни ход мысли</h2><p>Какую связь ты использовал? Почему действие допустимо? Как можно проверить ответ другим способом?</p><textarea id="note" placeholder="Я выбрал(а)… потому что… Проверил(а)…">${E(l.note||'')}</textarea><p class="muted">Текст сохранится для обсуждения с преподавателем. Автоматическая проверка не оценивает качество объяснения.</p><div class="actions"><a class="btn" href="#report">Мой отчёт</a>${nextLesson(id)?`<a class="btn primary" href="#lesson=${nextLesson(id)}">Следующая тема →</a>`:`<a class="btn primary" href="../../grade7/geometry-rebuild/">Конец списка · выбрать, что повторить</a>`}</div></section>`;$('#note').oninput=e=>{l.note=e.target.value.slice(0,10000);save();};}if(id.startsWith('grade7-r-photo-proof-')){if($('#new'))$('#new').textContent='Повторить этот рисунок';const note=document.createElement('p');note.className='muted';note.textContent='Этот рисунок повторяется. Для нового условия выбери похожий урок в маршруте; полноту доказательства проверит преподаватель.';box.append(note);if(l.stage===2&&l.step===t.steps.length)box.querySelector('h2 + p').textContent='Теперь объясни доказательство своими словами.';}save();}
function showPhotoProof(id,t,l){
 const P=PathPracticeView.photoProof,data=P.lesson(t);
 document.querySelector('header').innerHTML='<strong>MathExam · Геометрия</strong><nav aria-label="Учебная навигация"><a class="btn" href="../../grade7/geometry-rebuild/">Все темы</a></nav>';
 root.innerHTML=P.markup(t,l);
 const go=stage=>{l.stage=stage;if(stage===2){l.help=true;expose(t);}save();render();};
 P.bind(root,t,l,{
  start:()=>go(2),write:()=>go(4),noteLimit:10000,
  select(value){l.draft=value;save();},
  check(answer){
   if(l.stage!==2||l.step>=6)return;
   if(!answer.trim())return feedback('Сначала выбери ответ.',true);
   const step=l.step;l.draft=answer;l.help=true;l.attempted=true;expose(t);
   if(D.correct(t.steps[step],answer)){
    l.step++;l.draft='';l.done=l.step===6;if(l.done)l.guided++;
    save();render();feedback(data.reasons[step]);$('#photo-question')?.focus({preventScroll:true});
   }else{save();feedback(data.wrong[step],true);}
  },
  hint(){l.help=true;$('#hintText').textContent=data.hints[l.step];save();},
  note(value){l.note=value;save();}
 });
 save();
}
function nextLesson(id){const list=D.practice.foundation;if(list.includes(id)&&list.indexOf(id)<list.length-1)return list[list.indexOf(id)+1];const rebuild=D.meta.find(m=>m.id===id)?.geometryRebuild===true,photo=id.startsWith('grade7-r-photo-proof-');if(photo){const photos=['grade7-r-photo-proof-1','grade7-r-photo-proof-3','grade7-r-photo-proof-2'];return photos[photos.indexOf(id)+1]||null;}const course=D.meta.filter(m=>(m.geometryRebuild===true)===rebuild&&!m.id.startsWith('grade7-r-photo-proof-'));if(rebuild)course.sort((a,b)=>a.section-b.section);const next=course.findIndex(m=>m.id===id)+1;return rebuild?(course[next]?.id||null):course[next%course.length].id;}
function answerForm(t){return PathPracticeView.answerForm(t,10000);}
function examPool(pos){return PathExamPool.select(D.meta,pos);}
function startRun(kind){reconcile();if(state.active&&state.active.kind!==kind){root.innerHTML='<h1>Есть незавершённая проверка</h1><p>Сначала завершите её или сохраните как прерванную.</p><button id="resume">Продолжить</button> <button id="finish">Завершить с текущими ответами</button>';$('#resume').onclick=()=>setHash(state.active.kind);$('#finish').onclick=()=>finishRun(true);return;}if(!state.active){root.innerHTML=`<h1>${kind==='exam'?'Пробная работа':'Найдём точку старта'}</h1><p>21 авторская задача, по одной на позицию. Можно пропускать. Ответы и разбор появятся после завершения. Эта выборка не охватывает все подтипы экзамена.</p><p>${kind==='exam'?'Ориентир — 180 минут. Часы не отправляют работу автоматически.':'Время не ограничено. Диагностика нужна для выбора темы, а не для отметки.'}</p><button id="start" class="primary">Начать</button>`;$('#start').onclick=()=>{if(!reconcile())return;if(state.active){render();return;}state.active={kind,seed:state.serial++,ids:Array.from({length:21},(_,i)=>examPool(i+1)[state.serial%examPool(i+1).length].id),i:0,answers:[],start:Date.now(),assisted:false};save();render();};return;}const r=state.active;if(r.i>=21)return finishRun(false);const displayedIndex=r.i,displayedRun=runIdentity(r);let id=r.ids[r.i],t=D.task(id,r.seed+r.i);root.innerHTML=`<p class="eyebrow">${r.kind==='exam'?'Пробная работа':'Диагностика'} · ${r.i+1}/21</p><div class="meter"><span style="width:${r.i/21*100}%"></span></div><section class="panel"><p class="task">${M(t.q)}</p>${support(t)}${answerForm(t)}<p id="feedback" role="status"></p><div class="actions"><button id="skip">Пока не знаю</button><button id="finish">Завершить сейчас</button></div><p class="muted">Прошло ${Math.floor((Date.now()-r.start)/60000)} мин. Открытие обучения во время проверки будет отмечено как помощь.</p></section>`;$('#answer').value=r.draft||'';$('#answer').oninput=e=>{const value=e.target.value.slice(0,10000);if(!reconcile())return;if(!state.active||runIdentity(state.active)!==displayedRun||state.active.i!==displayedIndex){state.examDrafts=(state.examDrafts||[]).concat({lesson:id,attempt:displayedRun+':'+displayedIndex,field:'examDraft',value});save();feedback('В другой вкладке уже открыт следующий вопрос. Твой ответ сохранён в копиях работы.');return;}r.draft=value;save();};const next=skip=>{const shown=displayedIndex;if(!reconcile())return;if(!state.active||runIdentity(state.active)!==runIdentity(r)||state.active.i!==shown){render();return;}let v=skip?'':$('#answer').value;if(!skip&&!v.trim())return feedback('Введите ответ или выберите «Пока не знаю».',true);r.answers.push({id,seed:r.seed+r.i,value:v,correct:!skip&&D.correct(t,v),previouslySeen:seen(t)});expose(t);r.draft='';r.i++;save();render();};$('#answerForm').onsubmit=e=>{e.preventDefault();next(false);};$('#skip').onclick=()=>next(true);$('#finish').onclick=()=>finishRun(true);}
function runIdentity(run){return JSON.stringify([run.kind,run.seed,run.start]);}
function finishRun(interrupted){if(!reconcile())return;let r=state.active;if(!r)return;while(r.answers.length<21){let i=r.answers.length;r.answers.push({id:r.ids[i],seed:r.seed+i,value:'',correct:false,skipped:true});}r.finished=Date.now();r.interrupted=interrupted;state.runs.push(r);state.runs=state.runs.slice(-200);state.active=null;save();setHash('report');}
function report(){let latest=state.runs.at(-1),wrong=latest?.answers.filter(x=>!x.correct)||[];root.innerHTML=`<h1>Что уже получается</h1><p>Подсказки, исправления и ранее показанные условия учитываются отдельно. Отчёт не означает полного освоения позиции экзамена.</p>${latest?`<section class="panel"><h2>Последняя ${latest.kind==='exam'?'пробная работа':'диагностика'}: ${latest.answers.filter(x=>x.correct).length}/21</h2><p>${latest.interrupted?'Завершена досрочно. ':''}${latest.assisted?'С обращением к обучению. ':''}${latest.answers.some(x=>x.previouslySeen)?'Часть условий была показана раньше.':''}</p>${wrong.length?`<div class="callout"><b>Следующий шаг</b><p>Начни с темы «${E(D.meta.find(m=>m.id===wrong[0].id).title)}».</p><a class="btn primary" href="#lesson=${wrong[0].id}">Разобраться в первой трудности</a></div>`:'<p>Эта выборка решена. Попробуй новые варианты и вернись к темам через день.</p>'}<details><summary>Ответы и объяснения</summary><ol>${latest.answers.map(a=>{let t=D.task(a.id,a.seed),last=t.steps.at(-1);return `<li><b>${a.correct?'Верно':'Повторить'} · ${E(D.meta.find(m=>m.id===a.id).title)}</b><p>${M(t.q)}</p><p>Ваш ответ: ${M(a.value||'пропуск')}. ${t.rule||t.answerKind==='solutions'?'Возможны разные ответы; проверяются все условия.':'Ответ: '+M(D.answerText(t))+'.'} ${M(last.why)}</p><a href="#lesson=${a.id}">Урок</a></li>`;}).join('')}</ol></details></section>`:''}<div class="scroll"><table><thead><tr><th>Тема</th><th>Разборов</th><th>Новых самостоятельных</th></tr></thead><tbody>${D.meta.map(m=>{let l=state.lessons[m.id]||{};return `<tr><td><a href="#lesson=${m.id}">${m.grade7?'7 класс':m.pos+'.'} ${E(m.title)}</a></td><td>${l.guided||0}</td><td>${l.independent||0}</td></tr>`;}).join('')}</tbody></table></div><div class="actions"><button id="export">Скачать работу и резервную копию</button><label>Восстановить свою копию <input type="file" id="import" accept="application/json"></label></div><p id="feedback" role="status"></p><p class="muted">Восстановление заменяет только данные этого нового маршрута. Старые модули, тренажёры и их ключи не затрагиваются.</p>`;$('#export').onclick=()=>download(state);$('#import').onchange=async e=>{try{let f=e.target.files[0];if(!f||f.size>2000000)throw Error();let x=readProgress(await f.text());if(!valid(x))throw Error();download(state,'before-import.json');const restored=progress?.replace(x);if(!restored)throw Error();state=restored;writable=progress.isWritable();report();recoveryUI();feedback(writable?'Копия восстановлена; предыдущая работа выгружена отдельным файлом.':'Копия сохранена для восстановления. Скачай все копии: общая запись сейчас недоступна.');}catch(e){feedback('Файл не подходит. Текущая работа не изменена.',true);}};}
function download(x,name='EGE_baza_work.json'){downloadJSON(writeProgress(x),name);}
function downloadJSON(x,name){let u=URL.createObjectURL(new Blob([JSON.stringify(x,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
function render(){mountedTaskFirst=null;let h=location.hash.slice(1)||'map';if(!h.startsWith('lesson=')&&h!=='grade7')courseChrome(null);if(state.active&&!['exam','diagnostic','report'].includes(h)){state.active.assisted=true;save();}if(h.startsWith('lesson='))showLesson(h.slice(7));else if(h==='diagnostic'||h==='exam')startRun(h);else if(h==='report')report();else if(h==='foundation')foundation();else if(h==='grade7')grade7Map();else map();}
window.addEventListener('hashchange',()=>{render();root.focus({preventScroll:true});});window.addEventListener('pagehide',save);window.addEventListener('storage',event=>{progress?.handleStorage(event,state);writable=!!progress?.isWritable();mountedTaskFirst?.refreshProgress();recoveryUI();});window.PathCourse={state:()=>state,valid,KEY};render();recoveryUI();})();
