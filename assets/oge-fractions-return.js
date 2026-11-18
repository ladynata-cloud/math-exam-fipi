/* Return from basic fraction practice to the active task and hint in OGE #6. */
(function(){
  'use strict';
  const nav=document.querySelector('nav.oge-wayfinding');
  if(!nav)return;
  const params=new URLSearchParams(location.search);
  const draftKey='mathExam.oge6.tabDrafts.v1';
  const returnKey='mathExam.oge6.tabReturn.v1';
  if(window.self!==window.top||params.get('board')==='1'||window.MathExamBookEdition)return;
  if(typeof saveProgress==='function'&&!window.OgeCourseSharedMode){
    const onlineTask6=location.pathname==='/trainers/oge-task6-fractions.html';
    const downloadedTask6=document.body?.dataset.ogeFoundation==='6'&&
      document.querySelector('script[data-inline-source="/assets/oge-fractions-return.js"]');
    if(onlineTask6||downloadedTask6){
      enhanceTask6(onlineTask6&&!downloadedTask6);
      return;
    }
  }
  const fromTask=params.get('oge6Task');
  const fractionTrainer=/^\/trainers\/oge-basics\/fraction-(?:meaning|common-denominator)\.html$/.test(location.pathname);
  if(!fractionTrainer||fromTask===null||!/^\d{1,5}$/.test(fromTask))return;
  const context=readTab(returnKey);
  if(String(context?.order?.[context.pos])!==fromTask)return;
  const back=document.createElement('a');
  const target=new URL('/trainers/oge-task6-fractions.html',location.origin);
  target.searchParams.set('resumeTask',fromTask);
  target.hash='taskHeading';
  back.href=target.href;
  back.textContent='← Вернуться к задаче ОГЭ №6';
  back.dataset.oge6Return='';
  nav.prepend(back);

  function enhanceTask6(online){
    // Typing in this tab must not overwrite progress recorded by another tab.
    const previousDrafts=readTab(draftKey);
    let drafts=previousDrafts&&typeof previousDrafts==='object'&&!Array.isArray(previousDrafts)?previousDrafts:{};
    document.addEventListener('input',event=>{
      if(event.target.id!=='ans')return;
      drafts[order[pos]]=event.target.value.slice(0,128);
      writeTab(draftKey,drafts);
    });
    const clearDrafts=()=>{drafts={};writeTab(draftKey,drafts);writeTab(returnKey,null);};
    document.addEventListener('click',event=>{
      if(event.target.closest('#restart,#again,#chips .chip:not(.on)'))clearDrafts();
    },true);
    document.getElementById('shuffle').addEventListener('change',clearDrafts,true);
    for(const link of document.querySelectorAll('#settings aside[aria-label="Повторить дроби"] a')){
      const route=new URL(link.getAttribute('href'),online?location.href:'https://mathexam.space/trainers/');
      link.href=route.href;
      link.target='_blank';
      link.rel='noopener';
      if(!online)continue;
      link.addEventListener('click',event=>{
        if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey){
          link.href=route.href;
          link.target='_blank';
          return;
        }
        const task=order[pos];
        const target=new URL(route);
        const resumable=Number.isInteger(task)&&writeTab(returnKey,{cat,order,pos,shuffle,records,streak,hint:captureHint(task)});
        if(resumable){
          target.searchParams.set('oge6Task',String(task));
          history.replaceState({...history.state,oge6SupportTask:String(task)},'');
        }
        link.href=target.href;
        link.target=resumable?'_self':'_blank';
      });
    }
    const resume=online?(params.get('resumeTask')??history.state?.oge6SupportTask??null):null;
    const resumed=resume!==null&&restoreTabContext(resume);
    for(const task of order){
      if(typeof drafts[task]==='string'){
        records[task]={...(records[task]||createRecord()),lastInput:drafts[task].slice(0,128)};
      }
    }
    if(resumed||typeof drafts[order[pos]]==='string')renderTask();
    if(resume!==null)clearResumeRequest();
    if(online)window.addEventListener('pageshow',event=>{
      // A cached Back navigation already has the live hint DOM.
      if(event.persisted&&history.state?.oge6SupportTask)clearResumeRequest();
    });
  }

  function clearResumeRequest(){
    const url=new URL(location.href);
    url.searchParams.delete('resumeTask');
    const state={...history.state};
    delete state.oge6SupportTask;
    history.replaceState(state,'',url);
  }

  function restoreTabContext(task){
    const saved=readTab(returnKey);
    if(!saved||!Number.isInteger(saved.pos)||!Array.isArray(saved.order)||String(saved.order[saved.pos])!==task||
      !CATS.some(([key])=>key===saved.cat))return false;
    const expected=TASKS.flatMap((problem,index)=>saved.cat==='all'||problem.cat===saved.cat?[index]:[]);
    if(saved.order.length!==expected.length||new Set(saved.order).size!==expected.length||
      !saved.order.every(index=>expected.includes(index)))return false;
    const kept={};
    for(const index of expected){
      const record=saved.records?.[index];
      const status=record?.status;
      const knownStatus=typeof status==='string'&&Object.hasOwn(STATUS_TEXT,status);
      if(!record||!Number.isSafeInteger(record.wrongAttempts)||record.wrongAttempts<0||
        (status!==null&&!knownStatus))continue;
      kept[index]={
        wrongAttempts:record.wrongAttempts,
        answerWasRevealed:record.answerWasRevealed===true,
        status,
        lastInput:typeof record.lastInput==='string'?record.lastInput.slice(0,128):'',
      };
    }
    // Keep any results recorded while this tab was in the support trainer.
    records=cat===saved.cat?{...kept,...records}:kept;
    if(cat!==saved.cat)streak=Number.isSafeInteger(saved.streak)&&saved.streak>=0?saved.streak:0;
    cat=saved.cat;order=saved.order;pos=saved.pos;shuffle=saved.shuffle===true;
    document.getElementById('shuffle').checked=shuffle;
    buildChips();
    restoreHint(saved.hint);
    return true;
  }

  function captureHint(task){
    const session=hintSessions[task];
    if(!session)return null;
    const {html,mode}=TASKS[task];
    const {index,open}=session;
    // The plan contains BigInts. Rebuild it from the matching exercise on return.
    return {html,mode,index,open,prompt:session.plan.steps[index]?.prompt??null,step:session.steps[index]};
  }

  function restoreHint(saved){
    const {html,mode}=TASKS[order[pos]];
    if(!saved||saved.html!==html||saved.mode!==mode||!Number.isInteger(saved.index)||saved.index<0)return;
    const session=hintSession();
    if(saved.index>session.plan.steps.length||(session.plan.steps[saved.index]?.prompt??null)!==saved.prompt)return;
    session.index=saved.index;
    session.open=saved.open===true;
    const oldStep=saved.step;
    if(!oldStep)return;
    const step=hintStepState();
    for(const key of ['draft','feedback','miniDraft','miniFeedback','miniChoice']){
      if(typeof oldStep[key]==='string')step[key]=oldStep[key].slice(0,128);
    }
    for(const key of ['valid','miniValid','labOpen','simpleOpen','exerciseOpen']){
      if(typeof oldStep[key]==='boolean')step[key]=oldStep[key];
    }
    for(const key of ['candidate','progress','count','selected','flipped']){
      const value=oldStep.lab?.[key];
      if(typeof value==='string')step.lab[key]=value.slice(0,128);
      if(typeof value==='boolean')step.lab[key]=value;
    }
  }

  function readTab(key){
    try{return JSON.parse(sessionStorage.getItem(key));}catch(_){return null;}
  }

  function writeTab(key,value){
    try{sessionStorage.setItem(key,JSON.stringify(value));return true;}catch(_){return false;}
  }
})();
