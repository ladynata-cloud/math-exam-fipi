(function(){
'use strict';
const managed=new URLSearchParams(location.search).get('learning')==='1';
window.MathExamRemediationManaged=managed;
if(!managed)return;
document.documentElement.classList.add('learning-remediation-mode');
const base=new URL('.',document.currentScript.src);
const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('learning-managed.css?v=arithmetic-help-20261010',base).href;document.head.append(css);
const hide=document.createElement('style');hide.textContent='html.learning-remediation-mode body > [data-remediation-standalone]{display:none!important}';document.head.append(hide);
const ready=document.readyState==='loading'?new Promise(resolve=>document.addEventListener('DOMContentLoaded',resolve,{once:true})):Promise.resolve();
function script(url){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=new URL(url,base).href;s.onload=resolve;s.onerror=()=>reject(Error('Не удалось загрузить тренажёр.'));document.head.append(s);});}
(async()=>{
 await ready;
 for(const element of document.body.children)if(!['SCRIPT','STYLE','LINK'].includes(element.tagName))element.setAttribute('data-remediation-standalone','');
 const main=document.createElement('main');main.id='learning-remediation-root';main.textContent='Подключаем сохранённое задание…';document.body.append(main);
 try{
  for(const file of ['../learning-bridge.js','multiplication-division/division-lab-core.js','learning-bank.js','learning-contracts.js'])await script(file);
  // Extra explanations must not prevent an existing saved task from opening.
  try{await script('learning-scaffolds.js?v=arithmetic-help-20261010');}catch(_){}
  await script('learning-managed.js?v=arithmetic-help-20261010');
 }
 catch(error){main.textContent='Тренажёр не загрузился. Обновите страницу: сохранённая работа останется в кабинете.';}
})();
})();
