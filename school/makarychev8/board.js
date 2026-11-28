(function (root) {
  'use strict';
  // Keep the free course and an embedded classroom session in separate stores.
  const limit = 56 * 1024;
  const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
  const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const keys = (obj, list) => plain(obj) && Object.keys(obj).length === list.length && list.every(key => own(obj, key));
  const asWire = value => JSON.stringify(value).replace(/[<>&]/g, symbol =>
    ({ '<': '\\u003c', '>': '\\u003e', '&': '\\u0026' })[symbol]);
  const size = text => new TextEncoder().encode(text).length;
  function connect(course) {
    if (!root.MathExamBoard) return;
    let applying = false, scheduled, notify = () => {}, lastValid;
    const main = document.getElementById('main');
    const details = () => Array.from(main.querySelectorAll('details'));
    function readWork() {
      const original = course.current(), tasks = {};
      for (const [id, task] of Object.entries(original.tasks)) {
        if (!(task.value || task.note || task.guided || task.hint || task.attempts || task.correct ||
              task.values.some(Boolean) || task.assisted || Object.keys(task.investigation || {}).length)) continue;
        const {events, firstAttempt, ...work} = task;
        tasks[id] = {...work, assisted:true, independent:false};
        if (work.completion) tasks[id].completion = {...work.completion, assisted:true, independent:false};
      }
      return asWire({version:1, tasks, practice:original.practice, last:original.last, origin:original.origin});
    }
    function capture() {
      return {
        route:location.hash || '#home', work:readWork(),
        open:details().map((element, index) => element.open ? index : -1).filter(index => index >= 0),
        number:document.getElementById('exercise-number')?.value || '',
        result:document.querySelector('#number-result h3')?.textContent.match(/\d+/)?.[0] || '',
        message:asWire(main.querySelector('.step:not(.completed) [role=status]')?.textContent || '')
      };
    }
    function validate(snapshot) {
      try {
        if (!keys(snapshot,['route','work','open','number','result','message']) || !course.routeAllowed(snapshot.route) ||
            typeof snapshot.work !== 'string' || typeof snapshot.message !== 'string' ||
            snapshot.message.length > 600 || !Array.isArray(snapshot.open) || snapshot.open.length > 64 ||
            !snapshot.open.every(i => Number.isSafeInteger(i) && i>=0 && i<64) ||
            ![snapshot.number,snapshot.result].every(v => typeof v==='string' && /^\d{0,4}$/.test(v)) ||
            size(JSON.stringify(snapshot))>limit) return false;
        const work = JSON.parse(snapshot.work), message=JSON.parse(snapshot.message);
        if (!keys(work,['version','tasks','practice','last','origin']) || work.version!==1 ||
            !plain(work.tasks) || !plain(work.practice) || typeof message!=='string') return false;
        if (!Object.entries(work.tasks).every(([id,task]) => course.taskAllowed(id) &&
            plain(task) && task.assisted===true && task.independent===false &&
            (!task.completion || (task.completion.assisted===true && task.completion.independent===false)))) return false;
        return Object.keys(work.practice).every(key=>/^[a-z-]{1,40}:[123]$/.test(key));
      } catch (_) { return false; }
    }
    function restore(snapshot) {
      if (!validate(snapshot)) throw new Error('Некорректное состояние занятия');
      clearTimeout(scheduled);
      applying=true;
      try {
        course.receive(JSON.parse(snapshot.work),snapshot.route);
        const number=document.getElementById('exercise-number');
        if(number){number.value=snapshot.number;if(snapshot.result)course.findNumber(Number(snapshot.result));}
        details().forEach((element,index)=>{element.open=snapshot.open.includes(index);});
        const feedback=main.querySelector('.step:not(.completed) [role=status]');
        if(feedback)feedback.textContent=JSON.parse(snapshot.message);
        lastValid=snapshot;
      } finally { applying=false; }
    }
    function current() {
      const snapshot=capture();
      if(validate(snapshot)){lastValid=snapshot;return snapshot;}
      if(!lastValid)throw new Error('Не удалось прочитать работу на доске');
      restore(lastValid);
      course.warn('Последняя запись превысила размер общей работы. Восстановлена предыдущая запись. Продолжите в новой комнате.');
      return lastValid;
    }
    if(!course.routeAllowed(location.hash)) history.replaceState(null,'',location.pathname+location.search+'#home');
    const api={getState:current,applyState:restore,validateState:validate};
    root.MathExamBoard.register({...api,id:'makarychev8',version:'1.0.0',stateSchemaVersion:1,parentOrigin:location.origin,
      subscribe(callback){
        notify=callback;
        const emit=()=>{if(applying)return;clearTimeout(scheduled);scheduled=setTimeout(()=>{
          if(applying)return;
          const previous=lastValid, next=current();
          if(JSON.stringify(previous)!==JSON.stringify(next))notify();
        },0);};
        const events=['click','input','change','submit','toggle','keydown'];
        events.forEach(event=>document.addEventListener(event,emit,true));root.addEventListener('hashchange',emit);
        return ()=>{clearTimeout(scheduled);events.forEach(event=>document.removeEventListener(event,emit,true));root.removeEventListener('hashchange',emit);};
      }});
    current();
  }
  root.MakarychevBoard={connect};
})(window);
