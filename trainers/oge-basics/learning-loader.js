(function(){
'use strict';
const managed=new URLSearchParams(location.search).get('learning')==='1';
window.MathExamRemediationManaged=managed;
const loaderScript=document.currentScript||document.querySelector('script[src*="learning-loader.js"]');
const base=new URL('.',loaderScript?loaderScript.src:new URL('/trainers/oge-basics/learning-loader.js',location.href));
const ready=document.readyState==='loading'?new Promise(resolve=>document.addEventListener('DOMContentLoaded',resolve,{once:true})):Promise.resolve();
function script(url){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=new URL(url,base).href;s.onload=resolve;s.onerror=()=>reject(Error('Не удалось загрузить тренажёр.'));document.head.append(s);});}
function style(url){const link=document.createElement('link');link.rel='stylesheet';link.href=new URL(url,base).href;document.head.append(link);}
async function contextualHelp(){
 style('basics-help.css?v=basics-context-20261020');
 await script('basics-help.js?v=basics-context-20261020');
}
if(!managed){
 // Keep the original teaching bank and its event handlers. Enhancement failures
 // leave the original working page available, including its native help.
 (async()=>{await ready;try{
  await contextualHelp();
  style('basics-standalone.css?v=basics-context-20261020');
  await script('basics-standalone.js?v=basics-context-20261020');
 }catch(_){} })();
 return;
}
document.documentElement.classList.add('learning-remediation-mode');
const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('learning-managed.css?v=basics-context-20261020',base).href;document.head.append(css);
const hide=document.createElement('style');hide.textContent='html.learning-remediation-mode body > [data-remediation-standalone]{display:none!important}';document.head.append(hide);
(async()=>{
 await ready;
 for(const element of document.body.children)if(!['SCRIPT','STYLE','LINK'].includes(element.tagName))element.setAttribute('data-remediation-standalone','');
 const main=document.createElement('main');main.id='learning-remediation-root';main.textContent='Подключаем сохранённое задание…';document.body.append(main);
 try{
  for(const file of ['../learning-bridge.js','../../learning/division-course-map.js?v=multiplication-complete-20261019','multiplication-division/division-lab-core.js','multiplication-division/multiplication-column-core.js?v=multiplication-complete-20261019','learning-bank.js','multiplication-division/quotient-estimate-core.js?v=arithmetic-robots-20261019','multiplication-division/division-course-core.js?v=arithmetic-robots-20261019','learning-contracts.js?v=arithmetic-robots-20261019'])await script(file);
  // Extra explanations must not prevent an existing saved task from opening.
  try{await script('learning-scaffolds.js?v=arithmetic-robots-20261019');}catch(_){}
  try{await script('../../learning/multiplication-support.js?v=multiplication-complete-20261019');}catch(_){}
  try{await contextualHelp();}catch(_){}
  await script('learning-managed.js?v=basics-context-20261020');
 }
 catch(error){main.textContent='Тренажёр не загрузился. Обновите страницу: сохранённая работа останется в кабинете.';}
})();
})();
