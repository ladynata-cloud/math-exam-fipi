(function (root) {
  'use strict';
  const draftKeys = ['domain','range','zeros','positive','negative','up','down','constant','parity','y0','y1','y2','y3','y4','plotX','plotY'];
  const stateKeys = ['taskId','mode','stage','drafts','marked','helpUsed','hintLevel','hintOpen','errors','feedback','diagnostic','panels'];
  const feedbackCodes = ['none','step-correct','point-correct','check-wrong','point-wrong'];
  function record(value, keys) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) return false;
    const own = Reflect.ownKeys(value);
    return own.length === keys.length && own.every(key => typeof key === 'string' && keys.includes(key) &&
      Object.hasOwn(Object.getOwnPropertyDescriptor(value,key),'value') && Object.getOwnPropertyDescriptor(value,key).enumerable);
  }
  function list(value, limit) {
    if (!Array.isArray(value) || Object.getPrototypeOf(value)!==Array.prototype || value.length > limit || Reflect.ownKeys(value).length !== value.length + 1) return false;
    for (let i=0;i<value.length;i++) {
      const d = Object.getOwnPropertyDescriptor(value,String(i));
      if (!d || !Object.hasOwn(d,'value') || !d.enumerable) return false;
    }
    return true;
  }
  const integer = (value,min,max) => Number.isInteger(value) && value >= min && value <= max;
  const safeText = value => typeof value === 'string' && value.length <= 200 && !/[<>\u0000-\u001f\u007f]/.test(value);
  function checkState(value) {
    const D=root.CollegeFunctionsData,E=root.CollegeFunctionsEngine;
    if (!record(value,stateKeys)) return false;
    const task=D.tasks.find(t=>t.id===value.taskId);
    if (!task || !['learn','test'].includes(value.mode) || !integer(value.stage,0,8) || !record(value.drafts,draftKeys)) return false;
    if (!draftKeys.every(key=>safeText(value.drafts[key])) || !['','even','odd','neither'].includes(value.drafts.parity)) return false;
    if (!integer(value.marked,0,task.points.length) || (value.stage<2 && value.marked!==0) ||
        (value.stage===2 && value.marked>=task.points.length) || (value.stage>=3 && value.marked!==task.points.length)) return false;
    if (typeof value.helpUsed!=='boolean' || typeof value.hintOpen!=='boolean' || !integer(value.hintLevel,0,2) || !integer(value.errors,0,100000)) return false;
    if ((value.hintLevel>0 && !value.helpUsed) || (value.hintOpen && (!value.helpUsed || value.hintLevel===0)) ||
        ((value.mode==='test' || value.stage===8) && (value.hintOpen || value.hintLevel!==0))) return false;
    if (!feedbackCodes.includes(value.feedback)) return false;
    if (value.feedback==='step-correct' && (value.stage===0 || value.stage===8)) return false;
    if (value.feedback==='point-correct' && (value.stage!==2 || value.marked===0)) return false;
    if (value.feedback==='point-wrong' && (value.stage!==2 || value.errors===0)) return false;
    if (value.feedback==='check-wrong' && (value.stage===2 || value.stage===8 || value.errors===0)) return false;
    const d=value.drafts,s=value.stage;
    // A shared stage is supported by the student's accepted answers, never by transported markup.
    if (s>0 && !E.sameSet(d.domain,task.domain)) return false;
    if (s>1 && !task.points.every((p,i)=>{const n=E.parseNumber(d['y'+i]);return n!==null&&E.near(n,p.y);})) return false;
    if (s>3 && !E.sameSet(d.range,task.range)) return false;
    if (s>4 && !E.sameZeros(d.zeros,task.zeros)) return false;
    if (s>5 && (!E.sameSet(d.positive,task.positive)||!E.sameSet(d.negative,task.negative))) return false;
    if (s>6 && (!E.sameIntervals(d.up,task.up,{allowOpenFinite:true}) || !E.sameIntervals(d.down,task.down,{allowOpenFinite:true}) ||
        !E.sameIntervals(d.constant,task.constant||[],{allowOpenFinite:true}))) return false;
    if (s>7 && d.parity!==task.parity) return false;
    const q=value.diagnostic;
    if (!record(q,['open','index','answers']) || typeof q.open!=='boolean' || !integer(q.index,0,D.diagnostics.length) ||
        !list(q.answers,D.diagnostics.length) || q.answers.length!==q.index) return false;
    if (!q.answers.every((answer,i)=>typeof answer==='string' && D.diagnostics[i].optionItems.some(o=>o.id===answer))) return false;
    if (!record(value.panels,['reference','cheatsheet']) || typeof value.panels.reference!=='boolean' || typeof value.panels.cheatsheet!=='boolean' ||
        (value.mode==='test' && value.panels.cheatsheet)) return false;
    return true;
  }
  function validateState(value) { try { return checkState(value); } catch (_) { return false; } }
  const clone=value=>JSON.parse(JSON.stringify(value));
  root.CollegeFunctionsBoardAdapter = {
    draftKeys,
    create(hooks) {
      let notify=null,applying=false,pending=false,last='';
      function getState() {
        const state=hooks.read();
        if (!validateState(state)) throw new TypeError('Invalid local college-functions board state');
        return clone(state);
      }
      function applyState(value) {
        if (!validateState(value)) throw new TypeError('Invalid college-functions board state');
        const state=clone(value);
        applying=true;
        try { hooks.write(state); last=JSON.stringify(getState()); }
        finally { applying=false; }
      }
      function changed() {
        if (applying || pending) return;
        pending=true;
        // Native events may run microtasks between capture and app listeners.
        // Read the settled state only after the entire event dispatch completes.
        root.setTimeout(()=>{
          pending=false;
          if (applying || !root.document) return;
          const next=getState(),serialized=JSON.stringify(next);
          if (serialized===last) return;
          if (!validateState(next)) return;
          last=serialized;
          if (notify) notify();
        },0);
      }
      const api={getState,applyState,validateState};
      root.CollegeFunctionsBoard=api;
      root.getBoardTrainerState=getState;
      root.applyBoardTrainerState=applyState;
      last=JSON.stringify(getState());
      for (const name of ['input','change','click','keydown','toggle','close','cancel']) document.addEventListener(name,changed,true);
      if (root.MathExamBoard && typeof root.MathExamBoard.register==='function') {
        root.MathExamBoard.register({
          id:'college-functions',version:'1.0.0',stateSchemaVersion:1,parentOrigin:root.location.origin,
          getState,applyState,subscribe(callback){notify=callback;return ()=>{if(notify===callback)notify=null;};}
        });
      }
      return api;
    }
  };
})(window);
