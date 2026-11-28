/* These public entries select an exercise. A shared room is chosen by its teacher. */
(function(root){
  'use strict';
  const topics=[
    {unitId:18, taskId:'v6-book-3-32', label:'Отношения'},
    {unitId:19, taskId:'v6-book-3-41-d', label:'Пропорции — проверка правильности'},
    {unitId:19, taskId:'v6-book-3-42-c', label:'Пропорции — решение уравнений'},
    {unitId:20, taskId:'ratio-equation-build', label:'Пропорции — составление уравнений'},
    {unitId:18, taskId:'ratio-division-whole', label:'Деление уголком натуральных чисел'},
    {unitId:18, taskId:'ratio-division-shift', label:'Деление уголком десятичных дробей со сдвигом запятой'}
  ];
  function boardHref(taskId,origin=''){
    const path='/trainers/vilenkin6-proportion/index.html?task='+encodeURIComponent(taskId);
    return origin+'/trainers/trainer-board.html?trainer='+encodeURIComponent(path);
  }
  function embeddedBoard(){
    if(!root.parent||root.parent===root)return '';
    try{
      if(root.parent.location.pathname.endsWith('/trainers/trainer-board.html'))return 'trainer';
      if(root.parent.location.pathname.endsWith('/trainers/group-board.html'))return 'group';
    }catch(_){return 'isolated';}
    return '';
  }
  function linksForUnit(unitId,origin=''){
    const selected=topics.filter(topic=>unitId===null || topic.unitId===unitId || (unitId===19 && topic.taskId==='ratio-equation-build'));
    if(!selected.length)return '';
    const board=embeddedBoard();
    if(board && (board!=='trainer' || typeof root.parent.openGrade6LessonTask!=='function'))return '';
    if(board==='trainer'){
      const buttons=selected.map(topic=>`<button type="button" data-ratio-board-switch="${topic.taskId}">${topic.label}</button>`);
      return `<nav aria-label="Темы на этой доске"><strong>На этой доске</strong><div class="actions">${buttons.join(' ')}</div></nav>`;
    }
    const links=selected.map(topic=>`<a class="button button-link secondary" href="${boardHref(topic.taskId,origin)}" data-ratio-board-topic="${topic.taskId}" target="_blank" rel="noopener noreferrer">${topic.label}</a>`);
    return `<nav aria-label="Темы на интерактивной доске"><strong>На интерактивной доске</strong><div class="actions">${links.join(' ')}</div><small>На общем уроке входи по ссылке учителя.</small></nav>`;
  }
  root.document?.addEventListener('click',event=>{
    const control=event.target.closest?.('[data-ratio-board-switch]');
    if(!control || embeddedBoard()!=='trainer')return;
    const taskId=control.dataset.ratioBoardSwitch;
    if(topics.some(topic=>topic.taskId===taskId))root.parent.openGrade6LessonTask?.(root,taskId);
  });
  root.RatioBoardTopics=Object.freeze({topics:Object.freeze(topics.map(Object.freeze)),boardHref,linksForUnit});
})(typeof window==='undefined'?globalThis:window);
