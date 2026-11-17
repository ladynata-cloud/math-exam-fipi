/* The board/cabinet owns navigation inside its embedded trainer. */
(function(){
  'use strict';
  const nav=document.querySelector('nav.oge-wayfinding');
  if(!nav)return;
  const params=new URLSearchParams(location.search);
  const draftKey='mathExam.oge6.tabDrafts.v1';
  const returnKey='mathExam.oge6.tabReturn.v1';
  if(window.self!==window.top||params.get('board')==='1'){
    nav.hidden=true;
    return;
  }
  if(typeof saveProgress==='function'&&!window.OgeCourseSharedMode){
    const onlineTask6=location.pathname==='/trainers/oge-task6-fractions.html';
    const downloadedTask6=document.body?.dataset.ogeFoundation==='6'&&
      document.querySelector('script[data-inline-source="/assets/oge-wayfinding.js"]');
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
    let drafts=readTab(draftKey)||{};
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
      link.addEventListener('click',()=>{
        const task=order[pos];
        const target=new URL(route);
        const resumable=Number.isInteger(task)&&writeTab(returnKey,{cat,order,pos,shuffle,records,streak});
        if(resumable)target.searchParams.set('oge6Task',String(task));
        link.href=target.href;
        link.target=resumable?'_self':'_blank';
      });
    }
    const resume=online?params.get('resumeTask'):null;
    const resumed=resume!==null&&restoreTabContext(resume);
    for(const task of order){
      if(typeof drafts[task]==='string'){
        records[task]={...(records[task]||createRecord()),lastInput:drafts[task].slice(0,128)};
      }
    }
    if(resumed||typeof drafts[order[pos]]==='string')renderTask();
    if(resume!==null){
      const url=new URL(location.href);
      url.searchParams.delete('resumeTask');
      history.replaceState(history.state,'',url);
    }
  }

  function restoreTabContext(task){
    const saved=readTab(returnKey);
    if(!saved||!Array.isArray(saved.order)||String(saved.order[saved.pos])!==task||
      !CATS.some(([key])=>key===saved.cat))return false;
    const expected=TASKS.flatMap((problem,index)=>saved.cat==='all'||problem.cat===saved.cat?[index]:[]);
    if(saved.order.length!==expected.length||new Set(saved.order).size!==expected.length||
      !saved.order.every(index=>expected.includes(index)))return false;
    // Keep any results recorded while this tab was in the support trainer.
    records=cat===saved.cat?{...saved.records,...records}:saved.records;
    if(cat!==saved.cat)streak=saved.streak;
    cat=saved.cat;order=saved.order;pos=saved.pos;shuffle=saved.shuffle;
    document.getElementById('shuffle').checked=shuffle;
    buildChips();
    return true;
  }

  function readTab(key){
    try{return JSON.parse(sessionStorage.getItem(key));}catch(_){return null;}
  }

  function writeTab(key,value){
    try{sessionStorage.setItem(key,JSON.stringify(value));return true;}catch(_){return false;}
  }
})();
