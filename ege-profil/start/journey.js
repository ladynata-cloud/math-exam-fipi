(function(root){
  'use strict';
  // Read-only presentation of the existing learning evidence. Choosing a link
  // never opens a condition, records help, or creates an empty progress record.
  const modes=['guided','plan','independent'];
  const safeId=id=>typeof id==='string'&&/^[a-z0-9-]+$/.test(id);
  const distinct=(values,allowed)=>[...new Set(Array.isArray(values)?values:[])].filter(id=>allowed.has(id));
  function sessionsFor(lesson,state){
    const tasks=new Set((lesson.tasks||[]).map(task=>task.id));
    return modes.flatMap(mode=>{
      const session=state?.data?.sessions?.[lesson.id+':'+mode];
      if(!session||!tasks.has(session.taskId))return [];
      return [{lesson,mode,session,time:Date.parse(session.started)||0,
        worked:!!(String(session.draft||'').trim()||(session.answers||[]).length||session.step>0||session.wrong||(mode==='independent'&&session.assisted))}];
    });
  }
  function lessonSummary(lesson,state){
    const record=state?.data?.records?.[lesson.id]||{};
    const tasks=lesson.tasks||[],all=new Set(tasks.map(task=>task.id)),pool=new Set(tasks.slice(-3).map(task=>task.id));
    const independent=distinct(record.independent,pool),recovered=distinct(record.recovered,pool),guided=distinct(record.guided,all);
    const attempts=Math.max(0,Math.min(100000,Number(record.attempts)||0));
    const mastered=independent.length>=2,canAdvance=new Set([...independent,...recovered]).size>=2;
    const started=!!(attempts||guided.length||independent.length||recovered.length||sessionsFor(lesson,state).length);
    const practiced=!!(attempts||guided.length||independent.length||recovered.length);
    const status=mastered?'Две новые задачи самостоятельно':canAdvance?'Закреплено на знакомых задачах':independent.length?'Одна новая задача самостоятельно':guided.length?'Есть работа с опорой':started?'Начато':'Можно начать';
    return {id:lesson.id,title:lesson.title,independent:independent.length,guided:guided.length,recovered:recovered.length,attempts,started,practiced,canAdvance,mastered,status};
  }
  function summarize(lessons,state){
    const topics=lessons.map(lesson=>lessonSummary(lesson,state));
    return {total:topics.length,mastered:topics.filter(topic=>topic.mastered).length,
      practiced:topics.filter(topic=>topic.practiced).length,started:topics.filter(topic=>topic.started).length,
      unstarted:topics.filter(topic=>!topic.started).length,recovered:topics.filter(topic=>topic.canAdvance&&!topic.mastered).length,topics};
  }
  function orderedExam(exam,byId){
    return [...new Set([...(exam.starterIds||[]),exam.entry,...(exam.lessonIds||[])])].filter(id=>safeId(id)&&byId.has(id)).map(id=>byId.get(id));
  }
  function starterProgress(lesson,state){
    const guided=state?.data?.records?.[lesson.id]?.guided||[];
    return lesson.tasks.slice(0,3).filter(task=>guided.includes(task.id)).length;
  }
  function choose({lessons=[],state,exam,exams=[]}={}){
    const byId=new Map(lessons.filter(lesson=>safeId(lesson.id)).map(lesson=>[lesson.id,lesson]));
    const selected=typeof exam==='object'&&exam?exam:exam===undefined?null:exams.find(item=>item.number===Number(exam));
    if(exam!==undefined&&!selected)return {lessonId:null,mode:null,href:'#calm',label:'Выбрать тему',reason:'Выберите раздел курса.',kind:'empty',fresh:false};
    const ordered=selected?orderedExam(selected,byId):exams.length?[...new Set(exams.flatMap(item=>orderedExam(item,byId)))]:[...byId.values()];
    const scope=selected?ordered:[...byId.values()];
    const summaries=new Map(scope.map(lesson=>[lesson.id,lessonSummary(lesson,state)]));
    const sessions=scope.flatMap(lesson=>sessionsFor(lesson,state));
    const starterPending=selected?.starterIds?.some(id=>byId.has(id)&&starterProgress(byId.get(id),state)<3);
    const ongoing=sessions.filter(item=>!item.session.done&&(item.worked||(
      item.lesson.vectorBasics?starterProgress(item.lesson,state)<3:!starterPending&&!summaries.get(item.lesson.id).canAdvance)))
      .sort((a,b)=>Number(b.worked)-Number(a.worked)||b.time-a.time||a.lesson.id.localeCompare(b.lesson.id));
    if(ongoing.length){
      const {lesson,mode}=ongoing[0];
      return {lessonId:lesson.id,mode,href:'#practice/'+lesson.id+'/'+mode,label:'Продолжить задачу',
        reason:'Сохранена работа: '+lesson.title+'. Продолжим с того же шага.',kind:'resume',fresh:false};
    }
    // Stay with the learner's recently practised line before returning to the
    // default first line. Looking at a blank task alone does not reorder a course.
    let candidates=ordered;
    const recent=sessions.filter(item=>item.session.done||item.worked).sort((a,b)=>b.time-a.time)[0];
    if(!selected&&recent){
      const index=exams.findIndex(item=>[...(item.starterIds||[]),...(item.lessonIds||[])].includes(recent.lesson.id));
      if(index>=0)candidates=[...exams.slice(index),...exams.slice(0,index)].flatMap(item=>orderedExam(item,byId));
      else if(!summaries.get(recent.lesson.id).canAdvance)candidates=[recent.lesson,...ordered];
    }
    const next=candidates.find(lesson=>lesson.vectorBasics?starterProgress(lesson,state)<3:!lessonSummary(lesson,state).canAdvance);
    if(next){
      if(next.vectorBasics){
        const count=starterProgress(next,state);
        return {lessonId:next.id,mode:'guided',href:'#practice/'+next.id+'/guided',label:count?'Следующая задача':next.id==='vec-basics-reading'?'Начать с основ':'Начать следующую тему',
          reason:next.summary,kind:'next',fresh:!!state?.data?.sessions?.[next.id+':guided']?.done};
      }
      const record=lessonSummary(next,state),old=state?.data?.sessions?.[next.id+':independent'];
      return {lessonId:next.id,mode:'independent',href:'#practice/'+next.id+'/independent',
        label:record.started?'Следующая задача':'Начать тему',
        reason:record.started?'Попробуйте другое условие без помощи: '+next.title+'.':'Следующая тема: '+next.title+'. Если трудно, помощь останется рядом.',
        kind:'next',fresh:!!old?.done};
    }
    if(candidates.length)return {lessonId:null,mode:null,href:'#checkpoint',label:'Смешанная проверка',
      reason:selected?'Темы этого номера пройдены. Попробуйте выбирать способ в смешанной проверке.':'Темы первой части пройдены. Проверьте выбор способа на новых условиях разных номеров.',kind:'checkpoint',fresh:false};
    return {lessonId:null,mode:null,href:'#calm',label:'Выбрать тему',reason:'Откройте карту курса и выберите раздел.',kind:'empty',fresh:false};
  }
  const api={choose,lessonSummary,summarize,starterProgress};root.ProfileJourney=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);
