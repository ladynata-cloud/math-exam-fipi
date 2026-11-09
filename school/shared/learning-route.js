/* Shared presentation only: adapters supply validated course evidence, never storage. */
(function (root) {
  'use strict';
  const escape = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const count = value => Number.isSafeInteger(value) && value > 0 ? value : 0;
  const route = value => typeof value === 'string' && /^#(?:lesson\/[a-z0-9-]+(?:\/\d+)?|practice\/[a-z-]+\/[123]|progress|skills)$/.test(value) ? value : '#home';
  function lessonModel(lesson) {
    const total = count(lesson.total), done = Math.min(total, count(lesson.done));
    const independent = Math.min(done, count(lesson.independent));
    return {...lesson, total, done, independent, assisted:done-independent, studied:lesson.studied === true,
      started:lesson.started === true || done > 0, href:route(lesson.href), confirmed:total > 0 && independent === total};
  }
  function summary(lessons) {
    return lessons.reduce((s, l) => ({total:s.total+l.total, done:s.done+l.done,
      independent:s.independent+l.independent, assisted:s.assisted+l.assisted,
      confirmed:s.confirmed+Number(l.confirmed)}), {total:0,done:0,independent:0,assisted:0,confirmed:0});
  }
  function bar(s, label) {
    const percent = s.total ? Math.floor(100*s.done/s.total) : 0;
    const percentLabel = s.done > 0 && percent === 0 ? 'меньше 1%' : percent+'%';
    return '<div class="lr-bar" role="progressbar" aria-label="'+escape(label)+'" aria-valuemin="0" aria-valuemax="'+(s.total||1)+'" aria-valuenow="'+s.done+'" aria-valuetext="'+s.done+' из '+s.total+' задач; самостоятельно '+s.independent+'">'+
      '<span class="lr-bar-independent" style="width:'+(s.total?100*s.independent/s.total:0)+'%"></span><span class="lr-bar-assisted" style="width:'+(s.total?100*s.assisted/s.total:0)+'%"></span></div>'+
      '<p class="lr-bar-caption">Решено '+s.done+' из '+s.total+' задач · '+percentLabel+'</p>';
  }
  function status(l) {
    if (l.confirmed) return ['confirmed','Все задачи самостоятельно'];
    if (l.total && l.done === l.total) return ['assisted','Пройдено · закрепи на новых задачах'];
    if (l.started) return ['started','Решаю задачи'];
    if (l.studied) return ['studied','Теория изучена'];
    return ['new','Ещё не начато'];
  }
  function render(options) {
    const chapters = (options.chapters || []).map(c => ({...c,lessons:(c.lessons||[]).map(lessonModel)}));
    const lessons = chapters.flatMap(c => c.lessons), totals = summary(lessons);
    if (!lessons.length) return '<section class="lr-route"><h1>'+escape(options.title)+'</h1><p>Темы пока не добавлены.</p></section>';
    const resume = options.resume && route(options.resume.href) !== '#home' ? options.resume : null;
    const current = (resume && lessons.find(l => l.id === resume.lessonId)) || lessons.find(l => l.done < l.total) || lessons.find(l => !l.confirmed) || lessons[0];
    const currentChapter = chapters.find(c => c.lessons.includes(current));
    const complete = totals.total > 0 && totals.independent === totals.total;
    const touched = lessons.some(l => l.started || l.studied);
    const isNew = resume && resume.isNew === true;
    const action = isNew ? 'Начать' : complete && !resume ? 'Повторить' : resume || touched ? 'Продолжить' : 'Начать';
    const currentHref = resume ? route(resume.href) : current.href;
    const currentLabel = resume && resume.label ? resume.label : current.title;
    return '<section class="lr-route" aria-label="Маршрут обучения">'+
      '<header class="lr-overview"><div class="lr-intro"><p class="lr-eyebrow">Твой маршрут</p><h1>'+escape(options.title)+'</h1><p class="lr-scope">'+escape(options.scope)+'</p></div>'+
      '<div class="lr-course-progress">'+bar(totals,'Решённые задачи курса')+
      '<div class="lr-counts"><p><strong>'+totals.independent+'</strong><span>самостоятельно</span></p><p><strong>'+totals.assisted+'</strong><span>с помощью / после попыток</span></p></div>'+
      '<p class="lr-confirmed-count">Тем с самостоятельным решением всех задач: <strong>'+totals.confirmed+' из '+lessons.length+'</strong></p></div></header>'+
      '<div class="lr-next"><div><p class="lr-eyebrow">'+(complete?'Можно повторить':resume && !isNew?'Продолжаем с твоего места':'Следующий шаг')+'</p><p class="lr-next-title">'+escape(currentLabel)+'</p><p class="lr-next-chapter">'+(resume && resume.lessonId == null?'Отдельная тренировка':'Глава '+escape(currentChapter.id)+' · тема '+escape(current.order)+' из '+lessons.length)+'</p></div><a class="lr-primary" href="'+escape(currentHref)+'">'+action+' <span aria-hidden="true">→</span></a></div>'+
      '<details class="lr-guide"><summary>Что означают отметки?</summary><p>«Теория изучена» — твоя отметка после чтения. Она не добавляет решённых задач. Самостоятельный результат — верный ответ с первой попытки без подсказок и разбора. Остальные верные решения показаны отдельно.</p><p>Отметка «Все задачи самостоятельно» относится только к заданиям этой темы в курсе. Она не заменяет проверку знаний на новых задачах. Отдельные тренировки не засчитываются вместо задач темы.</p></details>'+
      '<div class="lr-map-heading"><h2>Главы и темы</h2><p>Иди по порядку или выбери нужную тему.</p></div><ol class="lr-chapters">'+
      chapters.map(chapter => {
        const s = summary(chapter.lessons), active = chapter === currentChapter;
        return '<li><section id="chapter-'+escape(chapter.id)+'" class="lr-chapter"><details'+(active?' open':'')+'><summary><span class="lr-chapter-number" aria-hidden="true">'+escape(chapter.id)+'</span><span class="lr-chapter-text"><span class="lr-chapter-title">'+escape(chapter.title)+'</span><span class="lr-chapter-caption">'+(active?'Текущая глава · ':'')+'тем: '+chapter.lessons.length+' · все задачи самостоятельно: '+s.confirmed+'</span><span class="lr-chapter-caption">Решено '+s.done+' / '+s.total+' · самостоятельно '+s.independent+'</span></span><span class="lr-chevron" aria-hidden="true">⌄</span></summary>'+bar(s,'Решённые задачи главы '+chapter.id)+
          '<ol class="lr-lessons">'+chapter.lessons.map(l => {
            const [kind,label] = status(l), selected = l === current;
            return '<li class="lr-topic lr-topic-'+kind+(selected?' lr-current':'')+'"><a href="'+escape(l.href)+'"'+(selected?' aria-current="step"':'')+'><span class="lr-topic-number" aria-hidden="true">'+escape(l.order)+'</span><span class="lr-topic-body">'+(selected?'<span class="lr-current-label">Ты здесь</span>':'')+'<span class="lr-topic-title">'+escape(l.title)+'</span><span class="lr-topic-status">'+label+'</span><span class="lr-topic-counts">Решено '+l.done+' / '+l.total+' · самостоятельно '+l.independent+'</span>'+(l.assisted?'<span class="lr-topic-help">С помощью / после попыток: '+l.assisted+'</span>':'')+(l.studied?'<span class="lr-theory-mark">Теория изучена · твоя отметка</span>':'')+'</span><span class="lr-topic-arrow" aria-hidden="true">→</span></a></li>';
          }).join('')+'</ol></details></section></li>';
      }).join('')+'</ol></section>';
  }
  root.MathExamLearningRoute = Object.freeze({render});
})(typeof window !== 'undefined' ? window : globalThis);
