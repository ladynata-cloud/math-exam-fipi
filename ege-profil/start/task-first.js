(function(root){
  'use strict';
  // Use the authored question, never the answer key or an intermediate step:
  // those can reveal a calculation that the pupil should still choose.
  function question(task){
    const text=String(task?.prompt||'').replace(/<figure\b[\s\S]*?<\/figure>/gi,'').replace(/<svg\b[\s\S]*?<\/svg>/gi,'').trim();
    const match=text.match(/(?:^|[.!?]\s+)((?:Найди|Найдите|Вычисли|Вычислите|Реши|Решите|Запиши|Запишите|Определи|Определите|Сколько|За сколько|За какое|В скольких|Какова|Какое|Какой|Чему|В ответ)[\s\S]*)/u);
    return match?match[1]:text;
  }
  // Older applied tasks already name their final unit in the diagram target.
  // Reuse that authored label without rewriting the bank or guessing a unit
  // for intermediate questions (which have no task diagram).
  function unit(task){
    if(task?.unit)return String(task.unit);
    if(!/^applied-/.test(task?.id||''))return '';
    const match=String(task?.diagram?.target||'').match(/,\s*(Дж|Вт|кПа|с|В|км\/ч|ч|деталей\/ч|кг|руб\.)\s*$/u);
    return match?match[1]:'';
  }
  const api={question,unit};root.ProfileTaskFirst=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
