(function(root){
'use strict';
// Current numbering is grounded in the FIPI 2027 project specification,
// pp. 16–19 (MA-11 EGE 2027 SPEC_profile, archive checked 2026-11-09):
// https://doc.fipi.ru/ege/demoversii-specifikacii-kodifikatory/2027/ma_11_2027.zip
// Historical trainer filenames and saved-work keys deliberately stay unchanged.
const legacyItems=[
 {number:14,title:'Уравнения с отбором корней',goal:'Решить уравнение, обосновать преобразования и отобрать корни.',href:'/ege-profil/trainers/trigonometry.html?topic=equations',coverage:'Подготовка по тригонометрии; полный набор типов №14 ещё не собран.',legacyNumber:13,resources:[{title:'Формулы суммы и произведения',href:'/ege-profil/trainers/trig-sum-to-product.html'},{title:'Окружность и тригонометрия',href:'/ege-profil/trigonometry/index.html'}]},
 {number:15,title:'Стереометрия с доказательством',goal:'Выбрать сечение или проекцию, доказать нужное свойство и вычислить искомое.',href:'/ege-profil/atanasyan-10-11/index.html',coverage:'Маршрут по Атанасяну и 12 задач с пунктами а) и б).',legacyNumber:14,resources:[{title:'Дополнительные разборы стереометрии · подборка 2026',href:'/ege-profil/trainers/stereo-t14.html'}]},
 {number:16,title:'Неравенства',goal:'Сохранить ОДЗ, решить неравенство и проверить граничные точки.',href:'#exam/16',coverage:'18 пошаговых примеров и отдельные разборы логарифмов.',legacyNumber:15,resources:[{title:'Обычные и логарифмические неравенства',href:'/trainers/ege-profile/inequalities/index.html'},{title:'Логарифм с переменным основанием',href:'/trainers/ege-profile/log-inequalities/lesson.html'},{title:'Внутренний и внешний логарифмы',href:'/trainers/ege-profile/log-inequalities/nested.html'}]},
 {number:17,title:'Моделирование и оптимизация',goal:'Построить модель по условию, исследовать её и объяснить результат.',href:'#lesson/calc-extreme',coverage:'Пока подготовительные темы: полный маршрут нового №17 ещё не собран.',resources:[{title:'Начать с наибольшего и наименьшего значения',href:'#lesson/calc-extreme'},{title:'Перевести условие в формулу',href:'#lesson/applied-formula-limit'},{title:'Составить модель текстовой задачи',href:'#calm/11'}]},
 {number:18,title:'Планиметрия с доказательством',goal:'Найти связь на чертеже, обосновать её и выполнить вычисление.',href:'/ege-profil/trainers/planimetry-t17.html',coverage:'6 задач со сборкой доказательства и вычислением; набор типов частичный.',legacyNumber:17,resources:[{title:'Геометрическая основа',href:'#calm/1'}]},
 {number:19,title:'Задачи с параметром',goal:'Исследовать число решений, особые значения и границы ответа.',href:'/ege-profil/trainers/parameters-t18.html',coverage:'6 разобранных задач и короткая практика; набор типов частичный.',legacyNumber:18,resources:[{title:'Функции и графики для параметров',href:'#calm/12'}]},
 {number:20,title:'Числа и их свойства',goal:'Построить пример, найти оценку и доказать, что других возможностей нет.',href:'/ege-profil/trainers/numbers-t19.html',coverage:'6 задач с пунктами а), б), в) и короткая практика; набор типов частичный.',legacyNumber:19,resources:[]}
];
// The complete teaching sequence is distinct from the retained legacy collections.
const items=legacyItems.map(item=>({...item,
 href:'/ege-profil/part-two/index.html#exam/'+item.number,
 coverage:'6 учебных тем · 36 задач: по шагам, с планом и самостоятельно. Письменное обоснование — по критериям и с преподавателем.',
 resources:[{title:'Ранее созданные материалы этой темы',href:item.href},...item.resources]
}));
const stereoUnits=['space','polyhedra','box','parallel','skew','parallel-planes','sections','perpendicular','projection','dihedral','prism','pyramid','pyramid-frustum','box-volume','prism-volume','pyramid-volume','vectors','vector-operations','basis','coordinates','dot','plane-equation'];
const inequalitySteps={'rational':7,'repeated':6,'exponential':7,'fixed-log':6,'variable-log':9,'radical':7};
const inequalityLessons=Object.entries(inequalitySteps).flatMap(([family,steps])=>[1,2,3].map(i=>({id:family+'-'+i,steps,key:'mathExam.inequalities.'+family+'-'+i+'.v1'})));
const plain=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
function read(storage,key){const raw=storage.getItem(key);if(raw===null||raw==='')return null;const value=JSON.parse(raw);if(!plain(value))throw Error('invalid saved object');return value;}
function result(kind,text,detail,done=null,total=null){return {kind,text,detail,done,total};}
const unknown=()=>result('unavailable','Прогресс сейчас недоступен','Сохранения не изменены. Откройте тренажёр для продолжения.');
function countText(done,total,label,detail){return result(done?'practice':'not-started',label+': '+done+' из '+total,detail,done,total);}
function guidedStarted(v,max){
 if(!plain(v)||v.schema!==1||!Number.isInteger(v.step)||v.step<0||v.step>max||!Array.isArray(v.solved)||v.solved.length>max||v.solved.some((s,i)=>s!==i)||v.step>v.solved.length||!plain(v.answers)||!Array.isArray(v.helps)||v.helps.some(s=>!Number.isInteger(s)||s<0||s>=max)||!Number.isInteger(v.errors)||v.errors<0)return null;
 // The map reports activity only. It never turns a guided solved-prefix into
 // independent mastery or revalidates a written proof from a counter.
 return v.solved.length>0;
}
function progress(itemOrNumber,storage){
 const number=Number(typeof itemOrNumber==='object'?itemOrNumber?.number:itemOrNumber);
 if(!items.some(item=>item.number===number))return result('unknown','Прогресс в тренажёре','');
 if(number===17)return result('preparation','Подготовительные темы','Их результаты входят в прогресс первой части. Освоение №17 отдельно пока не оценивается.');
 if(!storage||typeof storage.getItem!=='function')return unknown();
 try{
  if(number===14){const v=read(storage,'ep_progress_v1');if(v&&!plain(v.xp))return unknown();const score=v?.xp.eq;if(score!==undefined&&(!Number.isInteger(score)||score<0||score>100000))return unknown();return countText(Math.min(8,score||0),8,'Очки практики уравнений','Это счётчик практикума. Полное решение с отбором корней проверяется отдельно.');}
  if(number===15){const v=read(storage,'mathExamStereo.v1');if(v&&(v.version!==1||!plain(v.units)))return unknown();const done=stereoUnits.filter(id=>plain(v?.units[id])&&v.units[id].guided===true).length;return countText(done,stereoUnits.length,'Разобрано тем по учебнику','Разборы с опорой. Примеры и собственные письменные доказательства оцениваются внутри курса.');}
  if(number===16){let started=0;for(const lesson of inequalityLessons){const v=read(storage,lesson.key);if(!v)continue;const active=guidedStarted(v,lesson.steps);if(active===null)return unknown();if(active)started++;}return countText(started,inequalityLessons.length,'Примеров с выполненными шагами','Включает начатые разборы с помощью. Это не число самостоятельных решений; дополнительные логарифмы учитываются в своих тренажёрах.');}
  const all=read(storage,'mathExamCourseProgress.v1');
  const id={18:'planimetry-t17',19:'parameters-t18',20:'numbers-t19'}[number],v=all?.[id];
  if(v!==undefined&&!plain(v))return unknown();
  if(number===18){if(v?.tasks!==undefined&&!plain(v.tasks))return unknown();const done=[1,2,3,4,5,6].filter(i=>plain(v?.tasks?.['p'+i])&&v.tasks['p'+i].proof===true&&v.tasks['p'+i].b===true).length;return countText(done,6,'Собрано разборов с вычислением','Готовые шаги доказательства и ответ. Собственное письменное обоснование проверяется отдельно.');}
  if(number===19){if(v?.keys!==undefined&&!plain(v.keys))return unknown();const done=[1,2,3,4,5,6].filter(i=>v?.keys?.['z'+i]===true).length;return countText(done,6,'Принято ответов на ключевые вопросы','Ответ мог быть дан после разбора. Полное исследование параметра этим счётчиком не подтверждается.');}
  if(v?.tasks!==undefined&&!plain(v.tasks))return unknown();let done=0;for(let i=1;i<=6;i++)for(const part of ['a','b','c'])if(plain(v?.tasks?.['p'+i])&&v.tasks['p'+i][part]===true)done++;
  return countText(done,18,'Принято ответов на пункты','Это ответы в тренажёре, включая работу с помощью. Доказательства и самостоятельность оцениваются отдельно.');
 }catch(_){return unknown();}
}
const api={items,progress};root.ProfileSecondPart=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
