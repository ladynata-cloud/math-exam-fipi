/* Presentation names for both saved and newly generated geometry tasks.
 * Task IDs, figure coordinates, mathematical notation and answers are untouched. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.GeometryObjectLabels=api;})(typeof window==='undefined'?globalThis:window,function(){
'use strict';
const typeNames={segment:'Отрезок',ray:'Луч',line:'Прямая'};
const rayFamilies=new Set(['grade7-r-angle-vertex','grade7-r-angle-protractor','grade7-r-ray-count','grade7-r-angle-region','grade7-r-angle-minutes','grade7-r-angle-parallel-sides','grade7-g-core-angle-measure','grade7-g-practice-angle-parts']);
function linearType(task,part){
 const explicit=String(part.elementLabel||'');
 if(/луч/i.test(explicit))return 'ray';if(/прямая/i.test(explicit))return 'line';if(/отрезок/i.test(explicit))return 'segment';
 if(Object.hasOwn(typeNames,part.extent))return part.extent;
 const id=task.id,kind=task.params?.kind,diagram=task.model?.diagram;
 // These source families draw finite representatives of rays and lines.
 // The same rules also work for their already-saved task snapshots.
 if(diagram?.type==='angles'||rayFamilies.has(id))return 'ray';
 if(['line-a','line-b','secant'].includes(part.id))return 'line';
 if(id==='grade7-r-construct-secant'||kind==='construct-secant')return 'line';
 if((id==='grade7-r-construct-midpoint-bisector'||kind==='construct-midpoint-bisector')&&task.params?.mode===1)return 'ray';
 if(id==='grade7-g-core-perpendicular')return part.id==='OE'?'ray':'line';
 if(id==='grade7-g-practice-vertical-proof')return 'line';
 if(id==='grade7-r-construct-exterior'&&['AD','BE'].includes(part.id))return 'ray';
 return 'segment';
}
function pointName(diagram,id){const value=diagram.points?.[id]?.label;return typeof value==='string'?value:id;}
function linearName(task,part){
 if(part.elementLabel)return part.elementLabel;
 const d=task.model.diagram;
 return typeNames[linearType(task,part)]+' '+pointName(d,part.from)+pointName(d,part.to);
}
function label(task,element){
 const original=String(element?.label||''),d=task?.model?.diagram;
 if(!d||!element)return original;
 if(Object.hasOwn(d.points||{},element.id))return 'Точка '+pointName(d,element.id);
 const circle=(d.circles||[]).find(part=>part.id===element.id);
 if(circle)return 'Окружность с центром '+pointName(d,circle.center);
 const angles=(d.angles||[]).filter(part=>part.id===element.id);
 if(angles.length){
  if(/угол/i.test(original))return original;
  const names=[...new Set(angles.map(part=>pointName(d,part.from)+pointName(d,part.vertex)+pointName(d,part.to)))];
  return (names.length>1?'Углы ':'Угол ')+(original.startsWith('∠')?original.replace(/∠/g,''):names.join(' и '));
 }
 const parts=(d.segments||[]).filter(part=>part.id===element.id);
 if(parts.length){
  // The classification exercise intentionally asks the pupil to determine the
  // object type. Naming that answer in its chooser would give it away.
  if(task.id==='grade7-g-core-point-line-ray'&&element.id==='figure'&&original==='Вся фигура')return original;
  if(/отрезок|отрезки|луч|прямая|прямые/i.test(original))return original;
  if(/^[A-ZА-Я]+\s*(?:↔|и)\s*[A-ZА-Я]+$/u.test(original))return 'Отрезки '+original;
  const names=[...new Set(parts.map(part=>linearName(task,part)))];
  const name=names.join(' и ');
  if(!original||/^[A-ZА-Я]+$/u.test(original)||/^Линия |^Часть /i.test(original))return name;
  return name+' · '+original[0].toLowerCase()+original.slice(1);
 }
 if(original.startsWith('∠'))return 'Угол '+original.slice(1);
 return original;
}
function description(task,element){
 const name=label(task,element),text=String(element?.description||'');
 if(text.startsWith('Элемент '))return name+'. '+text.replace(/^Элемент [^.]+\.\s*/u,'');
 return text.startsWith(name)?text:name+(text?'. '+text:'.');
}
function elements(task){return (task?.model?.elements||[]).map(element=>({...element,label:label(task,element),description:description(task,element)}));}
function constructionLabel(task,construction){
 const original=String(construction?.label||'');
 if(!/^(?:Провести|Построить) [A-ZА-Я]+$/u.test(original)&&!/^Продлить сторону: /u.test(original))return original;
 const parts=(task?.model?.diagram?.segments||[]).filter(part=>part.construction===construction.id);
 if(!parts.length)return original;
 const names=[...new Set(parts.map(part=>linearName(task,part)))];
 return 'Провести '+names.map(name=>name.startsWith('Прямая ')?'прямую '+name.slice(7):name[0].toLowerCase()+name.slice(1)).join(' и ');
}
return Object.freeze({label,description,elements,constructionLabel,linearType});
});
