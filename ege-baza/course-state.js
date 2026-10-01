(function(root){
 'use strict';
 function create(meta,bank){
 const KEY=meta.key,DAY=86400000,practiceTotal=bank.tasks.filter(t=>t.phase==='practice').length,checkTotal=bank.tasks.filter(t=>t.phase==='diagnostic').length;
 const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
 function number(raw){const s=String(raw).trim().replace(/,/g,'.').replace(/^−/,'-');return /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(s)&&Number.isFinite(Number(s))?Number(s):null;}
 const correct=(task,answer)=>number(answer)!==null&&Math.abs(number(answer)-task.answer)<1e-8;
 function snapshot(text,now=Date.now()){
  const out={status:'empty',runs:{},skills:[],solved:0,independent:0,confirmed:0,repeatAt:null,repeatReady:false};
  let raw={};if(text!==null&&text!==undefined){try{raw=JSON.parse(text);if(!object(raw)||raw.v!==1)throw Error('version');out.status='saved';}catch(e){out.status='unreadable';raw={};}}
  for(const phase of ['diagnostic','checkpoint','repeat']){
   const row=raw.runs?.[phase],tasks=bank.tasks.filter(t=>t.phase===phase),answers={};
   if(object(row))for(const t of tasks){const answer=row.answers?.[t.id];if(answer===null||(typeof answer==='string'&&answer.length<=120&&number(answer)!==null))answers[t.id]=answer;else break;}
   const count=Object.keys(answers).length,at=count===tasks.length&&Number.isFinite(row?.finishedAt)&&row.finishedAt>0?row.finishedAt:null;
   out.runs[phase]={started:object(row),count,total:tasks.length,finished:!!at,at,helped:row?.helped===true,correct:at?tasks.filter(t=>correct(t,answers[t.id])).length:null,answers:at?answers:null};
  }
  for(const id of bank.skills){
   const tasks=bank.tasks.filter(t=>t.skill===id&&t.phase==='practice');let done=0,solo=0,next=0,started=false;
   tasks.forEach(t=>{const r=raw.practice?.[t.id],valid=object(r)&&Number.isInteger(r.tries)&&r.tries>0&&r.tries<=100000&&typeof r.answer==='string'&&r.answer.length<=120;
    const solved=valid&&r.done===true&&correct(t,r.answer);if(solved){done++;if(r.tries===1&&r.hints!==true&&r.solution!==true)solo++;}
    if(object(r)&&(r.hints===true||r.solution===true||valid))started=true;
   });
   next=tasks.findIndex(t=>{const r=raw.practice?.[t.id];return !(object(r)&&Number.isInteger(r.tries)&&r.tries>0&&r.tries<=100000&&r.done===true&&typeof r.answer==='string'&&r.answer.length<=120&&correct(t,r.answer));});
   const countFor=phase=>{const run=out.runs[phase];return run.finished?bank.tasks.filter(t=>t.skill===id&&t.phase===phase&&correct(t,run.answers[t.id])).length:null;};
   const cp=out.runs.checkpoint,rp=out.runs.repeat;
   const level=rp.finished&&!rp.helped&&countFor('repeat')===2?4:cp.finished&&!cp.helped&&countFor('checkpoint')===2?3:solo>=3?2:done?1:0;
   out.skills.push({id,done,solo,next,started,level,diagnostic:countFor('diagnostic')});out.solved+=done;out.independent+=solo;if(level>=3)out.confirmed++;
  }
  if(out.runs.checkpoint.finished){out.repeatAt=out.runs.checkpoint.at+DAY;out.repeatReady=now>=out.repeatAt;}
  return out;
 }
 function recommend(s){
  const action=(kind,title,reason,hash,minutes)=>({kind,title,reason,hash,minutes});
  if(['unreadable','blocked'].includes(s.status))return action('recovery','Откройте модуль','Навигатор не смог прочитать сохранение. Сам модуль покажет доступные результаты и дальнейшие действия.','#map',null);
  for(const phase of ['repeat','checkpoint','diagnostic']){const r=s.runs[phase];if(r.started&&!r.finished&&(phase!=='repeat'||s.repeatReady))return action('resume','Продолжите начатую проверку',`Записано ответов: ${r.count} из ${r.total}. Вернитесь к следующему заданию; разбор будет после завершения.`, '#test-'+phase,null);}
  const diag=s.runs.diagnostic,cp=s.runs.checkpoint,rp=s.runs.repeat;
  if(!diag.finished&&!cp.finished)return action('diagnostic','Найдите точку старта',`${checkTotal} коротких заданий помогут выбрать, что повторить в этом модуле.`,'#map','10–15 мин');
  if(cp.finished){
   if(!rp.finished&&s.repeatReady)return action('repeat','Проверьте, что осталось в памяти',`Прошли сутки после итоговой проверки. Теперь доступен другой набор из ${checkTotal} задач.`,'#checks','10–15 мин');
   if(rp.finished)return action('report','Посмотрите результаты и следующий маршрут','Повторная проверка завершена. Обсудите отчёт с преподавателем и вернитесь к навыкам, которым ещё нужна практика.','#report','5 мин');
   return action('wait','Разберите итоговую проверку','Посмотрите решения и вопросы к преподавателю. Новый набор для повторения откроется через сутки после итога.','#results-checkpoint','5–10 мин');
  }
  const active=s.skills.find(x=>x.started&&x.next>=0);
  if(active)return action('practice','Продолжите практику','В этом навыке остались нерешённые задачи. Сохранённые ошибки и подсказки учтены.','#practice-'+active.id+'-'+active.next,'10 мин');
  if(s.solved===practiceTotal)return action('checkpoint','Проверьте себя самостоятельно','Тренировочные задачи решены. В итоговой проверке будут другие условия, а разбор появится в конце.','#checks','10–15 мин');
  const skill=s.skills.find(x=>x.done<4&&x.diagnostic<2)||s.skills.find(x=>x.done<4);
  return action('learn','Разберитесь с ближайшим навыком',skill?.diagnostic<2?'В стартовой проверке по этому навыку были затруднения. Начните с короткого объяснения и модели.':'Стартовая проверка пройдена. Можно выбрать урок или перейти к итоговой проверке этого модуля.','#learn-'+(skill?.id||bank.skills[0]),'5–10 мин');
 }
 return {KEY,DAY,snapshot,recommend,meta,bank};
 }
 const fallback={m01:{id:'m01',key:'mathexam.ege-baza.foundation.v1',title:'Числа, деньги и проценты',path:'../trainers/ege-baza/course/',reference:root.EgeBazaFoundationReference}};
 const defs=root.EgeBazaCourseDefinitions||fallback;
 const engines=Object.fromEntries(Object.entries(defs).map(([id,d])=>[id,create(d,d.reference)]));
 root.EgeBazaCourseState=engines.m01;
 root.EgeBazaCourseState.forModule=id=>engines[id]||null;
 root.EgeBazaCourseState.modules=Object.keys(engines);
})(globalThis);
