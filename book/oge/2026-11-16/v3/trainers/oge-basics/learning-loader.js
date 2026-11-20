/* Display copy only. Saved cabinet tasks retain their original canonical text. */
(function (root) {
  'use strict';
  function text(value) {
    return String(value ?? '')
      .replaceAll('Знаменатель — сколько равных частей всего. Числитель — сколько частей взяли.',
        'Знаменатель показывает, на сколько равных частей разделили целое. Числитель — сколько таких частей взяли.')
      .replaceAll('Знаменатель показывает, на сколько частей разделили',
        'Знаменатель показывает, на сколько равных частей разделили')
      .replaceAll('Нижнее число отвечает за количество равных частей.',
        'Знаменатель — число под чертой дроби. Оно показывает, на сколько равных частей разделили целое.')
      .replaceAll('какое число показывает количество всех равных частей?',
        'на сколько равных частей разделили целое?')
      .replaceAll('Все части показывает нижнее число.',
        'На сколько равных частей разделили целое, показывает знаменатель — число под чертой дроби.')
      .replaceAll('на сколько частей разделили целое.',
        'на сколько равных частей разделили целое.')
      .replaceAll('Числитель показывает, сколько частей взяли',
        'Числитель показывает, сколько таких частей взяли')
      .replaceAll('Верхнее число отвечает за выбранные части.',
        'Числитель — число над чертой дроби. Оно показывает, сколько таких частей взяли.')
      .replaceAll('сколько частей взяли?', 'сколько таких частей взяли?')
      .replaceAll('показывает выбранные части.', 'показывает, сколько таких частей взяли.');
  }
  root.MathExamFractionMeaningText = text;
})(typeof window === 'undefined' ? globalThis : window);

/* Remediation loader: the display adapter above is synchronous in both modes. */
(function(){
'use strict';
const managed=false; // Fixed book copies use independent local practice.
window.MathExamRemediationManaged=managed;
const loaderScript=document.currentScript||document.querySelector('script[src*="learning-loader.js"]');
const base=new URL('.',loaderScript?loaderScript.src:new URL('/book/oge/2026-11-16/v3/trainers/oge-basics/learning-loader.js',location.href));
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
  style('basics-standalone.css?v=fraction-controls-20261114');
  await script('basics-standalone.js?v=basics-context-20261020');
 }catch(_){} })();
 return;
}
})();
