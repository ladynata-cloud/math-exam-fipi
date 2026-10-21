(function(root){
  'use strict';
  // Use the authored question, never the answer key or an intermediate step:
  // those can reveal a calculation that the pupil should still choose.
  function question(task){
    const text=String(task?.prompt||'').replace(/<figure\b[\s\S]*?<\/figure>/gi,'').replace(/<svg\b[\s\S]*?<\/svg>/gi,'').trim();
    const match=text.match(/(?:^|[.!?]\s+)((?:Найди|Найдите|Вычисли|Вычислите|Реши|Решите|Запиши|Запишите|Определи|Определите|Сколько|За сколько|За какое|В скольких|Какова|Какое|Какой|Чему|В ответ)[\s\S]*)/u);
    return match?match[1]:text;
  }
  const api={question};root.ProfileTaskFirst=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
