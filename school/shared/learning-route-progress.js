/* Read-only adapter over validated course results. Study acknowledgements are separate. */
(function (root) {
'use strict';
const escape = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function create(options) {
  const {key, lessons, chapters, getState, validRoute, credit = () => true, warn = () => {}} = options;
  const metaKey = key + '.route.v1';
  const ids = new Set(lessons.map(l => l.id));
  let meta = {version:1, studied:{}}, writable = true;
  function validate(raw) {
    if (!raw || Array.isArray(raw) || raw.version !== 1 || !raw.studied || typeof raw.studied !== 'object' || Array.isArray(raw.studied)) throw Error('Неизвестный формат отметок теории.');
    const studied = {};
    for (const [id, value] of Object.entries(raw.studied)) if (ids.has(id) && value === true) studied[id] = true;
    return {version:1, studied};
  }
  try { const raw = localStorage.getItem(metaKey); if (raw) meta = validate(JSON.parse(raw)); }
  catch (_) { writable = false; warn('Отметки теории недоступны и не перезаписаны. Результаты задач хранятся отдельно.'); }
  function save() {
    if (!writable) return;
    // Merge acknowledgements made in another tab before writing this monotonic set.
    try { const raw = localStorage.getItem(metaKey); if (raw) Object.assign(meta.studied, validate(JSON.parse(raw)).studied); localStorage.setItem(metaKey, JSON.stringify(meta)); }
    catch (_) { writable = false; warn('Не удалось сохранить отметку теории. Перед закрытием скачай сохранение в «Моих результатах».'); }
  }
  function lessonRows() {
    const state = getState();
    return lessons.map(l => {
      let done = 0, independent = 0, started = false;
      l.tasks.forEach(t => {
        const r = state.tasks[t.id];
        if (!r) return;
        started ||= !!(r.value || r.note || r.attempts || r.step || r.correct || (r.values || []).some(Boolean));
        if (credit(t,r) && r.correct) { done++; if(r.independent) independent++; }
      });
      const index = l.tasks.findIndex(t => !state.tasks[t.id]?.correct || !credit(t,state.tasks[t.id]));
      return {id:l.id, title:l.title, order:l.order, total:l.tasks.length, done, independent, started,
        studied:meta.studied[l.id] === true, href:'#lesson/' + l.id + '/' + Math.max(0,index)};
    });
  }
  function resume(rows) {
    const state = getState();
    const last = validRoute(state.last?.hash);
    if (last?.startsWith('#practice/')) return {href:last, label:'Продолжить отдельную тренировку', lessonId:null};
    if (last?.startsWith('#lesson/')) {
      const [,id,index] = last.split('/'), l = lessons.find(l=>l.id===id), row = rows.find(r=>r.id===id);
      const task = l?.tasks[Number(index || 0)], saved = state.tasks[task?.id];
      // Resume drafts, including older-method work, exactly where the pupil left them.
      if (task && !saved?.correct) return {href:last, label:row.title, lessonId:id};
      if (row && row.done < row.total) return {href:row.href, label:row.title, lessonId:id};
    }
    const next = rows.find(r => r.done < r.total);
    if (next) return {href:next.href, label:next.title, lessonId:next.id, isNew:!last&&!rows.some(r=>r.started||r.studied)};
    return {href:'#skills', label:'Все учебные задачи пройдены. Продолжи самостоятельную тренировку', lessonId:rows.find(r=>r.independent<r.total)?.id || rows[0]?.id};
  }
  return {
    html() {
      const rows = lessonRows();
      return root.MathExamLearningRoute.render({title:options.title, scope:options.scope,
        chapters:chapters.map(c=>({id:c.id,title:c.title,lessons:rows.filter(r=>c.lessonIds.includes(r.id))})),resume:resume(rows)})
        + '<div class="row lr-tools"><a class="button quiet" href="#skills">Отдельные тренировки</a><a class="button quiet" href="#progress">Результаты и сохранение</a><a class="button quiet" href="#course-number-search">Найти номер учебника</a></div>';
    },
    studyButton(id) {
      const marked = meta.studied[id] === true;
      return '<div class="lr-study"><button type="button" data-action="route-studied" data-lesson="'+escape(id)+'"'+(marked?' disabled':'')+'>'+(marked?'✓ Теория изучена':'Отметить: теория изучена')+'</button><p class="small" data-route-study-status role="status">'+(marked?(writable?'Твоя отметка сохранена.':'Отметка учтена только в этой вкладке. Перед закрытием скачай сохранение в «Моих результатах».'):'Отметь после чтения. Это твоя отметка, не проверка знаний.')+'</p></div>';
    },
    markStudied(id) { if(!ids.has(id)) return false; meta.studied[id]=true; save(); return writable; },
    exportMeta() { return JSON.parse(JSON.stringify(meta)); },
    importMeta(raw) {
      if(raw === undefined) return true;
      let incoming;
      try { incoming=validate(raw); }
      catch (_) { warn('Отметки теории из файла не прочитаны. Результаты задач будут загружены отдельно.'); return false; }
      Object.assign(meta.studied,incoming.studied); save(); return true;
    }
  };
}
root.MathExamRouteProgress = {create};
})(window);
