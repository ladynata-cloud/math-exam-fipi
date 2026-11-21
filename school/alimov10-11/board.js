(function (root) {
  'use strict';
  const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const encode = value => JSON.stringify(value).replace(/[<>&]/g, c => ({'<':'\\u003c','>':'\\u003e','&':'\\u0026'})[c]);
  const byteSize = value => new TextEncoder().encode(value).length;

  function connect(course) {
    if (!root.MathExamBoard) return;
    const main = document.getElementById('main');
    const details = () => Array.from(main.querySelectorAll('details'));
    const status = () => main.querySelector('.step:not(.completed) [role="status"]');
    const roomLimit = 56 * 1024;
    let applying = false, pending, lastValid;

    function capture() {
      const original = course.current();
      const tasks = {};
      for (const [id, task] of Object.entries(original.tasks)) {
        // The table of contents reads all counters, including untouched tasks.
        if (!(task.value || task.feedback || task.guided || task.hint || task.note || task.assisted ||
              task.attempts || task.correct || task.values.some(Boolean))) continue;
        tasks[id] = task;
      }
      return {
        route:location.hash || '#home', work:encode({...original,tasks}),
        open:details().flatMap((d,i) => d.open ? [i] : []),
        search:encode(main.querySelector('#exercise-number')?.value || ''),
        submitted:encode(main.querySelector('#number-result')?.dataset.submitted ?? null),
        feedback:encode(status()?.textContent || '')
      };
    }
    function validate(s) {
      try {
        if (!isRecord(s) || Object.keys(s).sort().join(',')!=='feedback,open,route,search,submitted,work' ||
            !course.routeAllowed(s.route) || byteSize(JSON.stringify(s))>roomLimit ||
            !['work','search','submitted','feedback'].every(k=>typeof s[k]==='string') || !Array.isArray(s.open) ||
            s.open.length>64 || !s.open.every(i=>Number.isInteger(i)&&i>=0&&i<64)) return false;
        const work=JSON.parse(s.work), search=JSON.parse(s.search), submitted=JSON.parse(s.submitted), feedback=JSON.parse(s.feedback);
        if (typeof search!=='string' || search.length>180 || (submitted!==null && (typeof submitted!=='string'||submitted.length>180)) ||
            typeof feedback!=='string' || feedback.length>1200 || !isRecord(work) || work.version!==1 ||
            !isRecord(work.tasks) || !isRecord(work.practice) || !isRecord(work.models)) return false;
        return Object.entries(work.tasks).every(([id,task])=>course.taskAllowed(id)&&isRecord(task)) &&
          Object.keys(work.models).every(id=>course.routeAllowed('#lesson/'+id+'/0'));
      } catch (_) { return false; }
    }
    function restore(s) {
      if (!validate(s)) throw Error('Не удалось прочитать общую работу');
      clearTimeout(pending);
      applying=true;
      try {
        course.receive(JSON.parse(s.work),s.route);
        const field=main.querySelector('#exercise-number');
        if (field) {
          const submitted=JSON.parse(s.submitted);
          if (submitted!==null) course.search(submitted);
          field.value=JSON.parse(s.search);
        }
        details().forEach((d,i)=>{d.open=s.open.includes(i);});
        if (status()) status().textContent=JSON.parse(s.feedback);
        lastValid=s;
      } finally { applying=false; }
    }
    function current() {
      const s=capture();
      if (validate(s)) { lastValid=s; return s; }
      if (!lastValid) throw Error('Превышен предел общей работы');
      restore(lastValid);
      course.warn('В комнате осталось мало места. Восстановлена последняя запись. Для продолжения открой новую комнату.');
      return lastValid;
    }
    root.MathExamBoard.register({id:'alimov10-11',version:'1.0.0',stateSchemaVersion:1,parentOrigin:location.origin,
      getState:current, applyState:restore, validateState:validate,
      subscribe(notify) {
        const events=['click','input','change','submit','toggle','keydown'];
        const publish=()=>{
          if (applying) return;
          clearTimeout(pending);
          pending=setTimeout(()=>{
            if (applying) return;
            const previous=lastValid, next=current();
            if (JSON.stringify(previous)!==JSON.stringify(next)) notify();
          },0);
        };
        events.forEach(evt=>document.addEventListener(evt,publish,true));
        root.addEventListener('hashchange',publish);
        return ()=>{clearTimeout(pending);events.forEach(evt=>document.removeEventListener(evt,publish,true));root.removeEventListener('hashchange',publish);};
      }});
    current();
  }
  root.AlimovBoard={connect};
})(window);
