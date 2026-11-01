(function(){
'use strict';
const managed=false; // Fixed book copies use independent local practice.
window.MathExamRemediationManaged=managed;
const loaderScript=document.currentScript||document.querySelector('script[src*="learning-loader.js"]');
const base=new URL('.',loaderScript?loaderScript.src:new URL('/book/oge/2026-10-31/v2/trainers/oge-basics/learning-loader.js',location.href));
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
})();
