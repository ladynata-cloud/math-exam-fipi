/* =====================================================================
   CourseProgress — единый модуль прогресса курса «ОГЭ 1–5».
   Контракт хранения: localStorage['mathExamCourseProgress.v1'] =
     { <topic>: { solved:<number>, total:<number>, ...доп.поля } }
   Новые тренажёры должны писать прогресс ТОЛЬКО через этот модуль.
   ===================================================================== */
(function(){
  'use strict';
  var KEY='mathExamCourseProgress.v1', SCHEMA=1;
  function read(){ try{ var d=JSON.parse(localStorage.getItem(KEY)||'{}'); return (d&&typeof d==='object')?d:{}; }catch(e){ return {}; } }
  function commit(d){ try{ localStorage.setItem(KEY, JSON.stringify(d)); }catch(e){} }
  window.CourseProgress={
    KEY:KEY, SCHEMA:SCHEMA,
    readAll:read,
    get:function(topic){ return read()[topic]||null; },
    /* solved/total обязаны быть числами — иначе запись отклоняется */
    write:function(topic, solved, total, extra){
      if(typeof solved!=='number'||typeof total!=='number'||!isFinite(solved)||!isFinite(total)) return false;
      var d=read();
      d[topic]=Object.assign({}, d[topic], extra||{}, {solved:solved, total:total});
      commit(d); return true;
    },
    clear:function(topic){ var d=read(); delete d[topic]; commit(d); }
  };
})();
