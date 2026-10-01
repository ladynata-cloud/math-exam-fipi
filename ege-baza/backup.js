(function(root){
 'use strict';
 const FORMAT='mathexam-ege-baza-backup',VERSION=1,MAX_BYTES=262144;
 function create(api){
 const KEY=api.KEY,MID=api.meta.id;
 const phases=['diagnostic','checkpoint','repeat'];
 const tasks=api.bank.tasks;
 const plain=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
 const fail=message=>{throw new Error(message);};
 const bytes=text=>new TextEncoder().encode(text).length;
 const number=raw=>{const text=String(raw).trim().replace(/,/g,'.').replace(/^−/,'-');return /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(text)&&Number.isFinite(Number(text))?Number(text):null;};
 function fields(value,allowed,required=allowed){
  if(!plain(value)||Object.keys(value).some(k=>!allowed.includes(k))||required.some(k=>!Object.hasOwn(value,k)))fail('Формат сохранения не поддерживается. Возможно, файл создан другой версией курса.');
 }
 function parse(text){
  if(typeof text!=='string'||bytes(text)>MAX_BYTES)fail('Файл слишком большой. Допустимый размер — 256 КБ.');
  try{return JSON.parse(text);}catch(e){fail('Не удалось прочитать JSON. Выберите резервную копию этого курса, а не текстовый отчёт.');}
 }
 function validateState(raw){
  fields(raw,['v','practice','runs']);if(raw.v!==1)fail('Эта версия сохранения не поддерживается.');
  fields(raw.practice,tasks.filter(t=>t.phase==='practice').map(t=>t.id),[]);
  fields(raw.runs,phases,[]);
  const out={v:1,practice:{},runs:{}};
  for(const t of tasks.filter(t=>t.phase==='practice')){
   if(!Object.hasOwn(raw.practice,t.id))continue;
   const r=raw.practice[t.id];fields(r,['tries','hints','solution','done','answer']);
   if(!Number.isInteger(r.tries)||r.tries<0||r.tries>100000||typeof r.hints!=='boolean'||typeof r.solution!=='boolean'||typeof r.done!=='boolean'||typeof r.answer!=='string'||r.answer.length>120)fail('В файле повреждена запись тренировочной попытки.');
   if((r.tries===0&&r.answer!=='')||(r.tries>0&&number(r.answer)===null)||(r.done&&(r.tries===0||Math.abs(number(r.answer)-t.answer)>=1e-8)))fail('Ответы и отметки решения в файле не согласованы.');
   out.practice[t.id]={tries:r.tries,hints:r.hints,solution:r.solution,done:r.done,answer:r.answer};
  }
  for(const phase of phases){
   if(!Object.hasOwn(raw.runs,phase))continue;
   const r=raw.runs[phase],bank=tasks.filter(t=>t.phase===phase);fields(r,['answers','finishedAt','helped']);fields(r.answers,bank.map(t=>t.id),[]);
   if(typeof r.helped!=='boolean')fail('В файле повреждена отметка помощи.');
   let gap=false;const answers={};
   for(const t of bank){
    if(!Object.hasOwn(r.answers,t.id)){gap=true;continue;}
    const a=r.answers[t.id];if(gap||(a!==null&&(typeof a!=='string'||a.length>120||number(a)===null)))fail('В файле нарушен порядок ответов проверки.');
    answers[t.id]=a;
   }
   const complete=Object.keys(answers).length===bank.length;
   if(r.finishedAt!==null&&(!Number.isFinite(r.finishedAt)||r.finishedAt<=0||r.finishedAt>8640000000000000||!complete))fail('В файле неверно записано завершение проверки.');
   if(complete&&r.finishedAt===null)fail('Полная проверка не содержит времени завершения.');
   out.runs[phase]={answers,finishedAt:r.finishedAt,helped:r.helped};
  }
  return out;
 }
 function decode(text){
  const raw=parse(text);fields(raw,['format','version','exportedAt','modules']);
  if(raw.format!==FORMAT||raw.version!==VERSION)fail('Это не резервная копия поддерживаемой версии курса «Базовый ЕГЭ».');
  if(typeof raw.exportedAt!=='string'||!/^\d{4}-\d\d-\d\dT/.test(raw.exportedAt)||!Number.isFinite(Date.parse(raw.exportedAt)))fail('В файле повреждена дата создания.');
  fields(raw.modules,[MID]);fields(raw.modules[MID],['bankVersion','state']);
  if(raw.modules[MID].bankVersion!==1)fail('Задания в этом файле относятся к другой версии модуля.');
  return {format:FORMAT,version:VERSION,exportedAt:raw.exportedAt,modules:{[MID]:{bankVersion:1,state:validateState(raw.modules[MID].state)}}};
 }
 function get(storage){try{return storage.getItem(KEY);}catch(e){fail('Браузер не разрешил прочитать сохранение. Проверьте настройки хранения данных.');}}
 function summary(raw){
  if(raw===null)return api.snapshot(null);
  try{return api.snapshot(JSON.stringify(validateState(parse(raw))));}catch(e){return {status:'unreadable'};}
 }
 function exportBackup(storage,now=new Date()){
  const raw=get(storage);if(raw===null)fail('Пока нет сохранённой работы. Сначала выполните задание в выбранном модуле.');
  const state=validateState(parse(raw));
  return JSON.stringify({format:FORMAT,version:VERSION,exportedAt:now.toISOString(),modules:{[MID]:{bankVersion:1,state}}},null,2);
 }
 function preview(text,storage){
  const incoming=decode(text),before=get(storage),after=JSON.stringify(incoming.modules[MID].state);
  return Object.freeze({before,after,exportedAt:incoming.exportedAt,current:summary(before),incoming:summary(after)});
 }
 function restore(candidate,storage){
  // Revalidate payload at write boundary; never accept storage keys from a file.
  if(!candidate||typeof candidate.after!=='string'||!(candidate.before===null||typeof candidate.before==='string'))fail('Сначала выберите файл и проверьте предпросмотр.');
  const state=validateState(parse(candidate.after)),serialized=JSON.stringify(state);
  if(get(storage)!==candidate.before)fail('Прогресс изменился после предпросмотра. Снова выберите файл и сравните результаты.');
  try{storage.setItem(KEY,serialized);}catch(e){fail('Не удалось сохранить копию: браузер запретил запись или закончилось место. Прежнее сохранение не заменено.');}
  if(get(storage)!==serialized)fail('После записи результаты снова изменились. Проверьте другие вкладки и откройте «Мой прогресс».');
  return summary(serialized);
 }
 return {FORMAT,VERSION,MAX_BYTES,KEY,MID,meta:api.meta,decode,validateState,exportBackup,preview,restore,get,summary};
 }
 const backups=Object.fromEntries(root.EgeBazaCourseState.modules.map(id=>[id,create(root.EgeBazaCourseState.forModule(id))]));
 root.EgeBazaBackup=backups.m01;
 root.EgeBazaBackup.forModule=id=>backups[id]||null;
})(globalThis);
