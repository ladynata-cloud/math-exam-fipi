(function(root){'use strict';
const skills={
 signs:{title:'Сложение и вычитание чисел с разными знаками',path:'/trainers/oge-basics/negative-add-subtract.html'},
 fractions:{title:'Общий знаменатель и действия с дробями',path:'/trainers/oge-basics/fraction-common-denominator.html'},
 part:{title:'Смысл дроби: часть одного целого',path:'/trainers/oge-basics/fraction-meaning.html'},
 percent:{title:'Процент от числа и восстановление целого',path:'/trainers/oge-basics/percentages/percent-of-number-and-whole.html'},
 change:{title:'Процентное изменение и новая база',path:'/trainers/oge-basics/percentages/percent-change.html'},
 proportion:{title:'Пропорции и связь величин',path:'/trainers/oge-basics/percentages/proportion.html'},
 equations:{title:'Простые уравнения по шагам',path:'/trainers/simple-equations-stepwise.html'},
 powers:{title:'Степени и корни',path:'/trainers/oge-task8-powers-roots.html'},
 line:{title:'Отрицательные числа на прямой',path:'/trainers/oge-basics/negative-number-line.html'},
 decimalMultiply:{title:'Умножение десятичных дробей',path:'/trainers/arifmetika.html?level=n5c'},
 decimalDivide:{title:'Деление на десятичную дробь',path:'/trainers/oge-basics/multiplication-division/decimal-divisor-shift.html'},
 decimalAdd:{title:'Сложение десятичных дробей по разрядам',path:'/trainers/oge-basics/decimal-add-subtract.html'},
 area:{title:'Единицы площади',path:'/trainers/oge-basics/units-area.html'},
 lengthTime:{title:'Единицы длины и времени',path:'/trainers/oge-basics/units-length-time.html'},
 height:{title:'Основание и высота параллелограмма',path:'/geometry-course/atlas/area-parallelogram.html'}
};
const nextStep=(why,key=null)=>({why,key});
const targeted={
 choice: nextStep('Запиши полную стоимость для одного магазина: цена набора × количество + доставка. После этого сравни магазины.'),
 units: nextStep('Нарисуй куб со стороной 1 дм. Сколько сантиметров по одному ребру? Почему для объёма нужно умножить это число на себя три раза?'),
 'practice-delivery': nextStep('Сначала посчитай стоимость товаров в одном магазине. Сравни её с порогом: при точном равенстве доставка остаётся платной.'),
 'practice-luggage': nextStep('Возьми одну сумку и проверь её размеры и массу по очереди. Одного нарушения достаточно, чтобы исключить сумку.'),
 'practice-rental': nextStep('Сколько стокилометровых отрезков в маршруте? Используй это число, чтобы найти расход на всю поездку, а затем прибавь к цене топлива аренду.'),
 'practice-grid-parallelogram': nextStep('Выбери горизонтальное основание. Отметь перпендикуляр к нему и посчитай его длину в клетках.', 'height'),
 'practice-parallelogram': nextStep('Найди высоту к указанному основанию. Подставь длины основания и перпендикулярной к нему высоты в формулу площади.', 'height'),
 'practice-grid-cut': nextStep('Дострой фигуру до прямоугольника. Найди его площадь и вычти площадь выреза.'),
 'practice-decimals': ({stepIndex,value,task})=>{
  const foundProduct=stepIndex===undefined&&numeric(value)===task?.steps?.[0]?.a;
  return stepIndex===1||foundProduct
   ?nextStep('Поставь запятые двух слагаемых друг под другом и сложи одинаковые разряды.', 'decimalAdd')
   :nextStep('Проверь произведение первых двух чисел отдельно. Посчитай знаки после запятой в обоих множителях и оцени, где должна стоять запятая в произведении.', 'decimalMultiply');
 },
 'practice-decimal-division': ({stepIndex})=>stepIndex===2
   ?nextStep('Раздели целые числа, которые уже получил.')
   :nextStep('Во сколько раз надо увеличить делитель, чтобы он стал целым? Увеличь делимое во столько же раз.', 'decimalDivide'),
 'practice-area-units': ({stepIndex})=>stepIndex===0
   ?nextStep('Сначала переведи один метр в сантиметры.', 'lengthTime')
   :nextStep('Представь квадрат 1 м × 1 м. Сколько квадратов 1 см × 1 см в одном ряду? Сколько таких рядов?', 'area'),
 'practice-time': nextStep('Переведи целые часы в минуты и только затем прибавь оставшиеся минуты.', 'lengthTime'),
 'practice-units-match': nextStep('Представь размер каждого предмета. Если сравнение трудно, переведи близкие варианты в одинаковые единицы длины.', 'lengthTime'),
 'practice-trig-angle': nextStep('Один полный оборот — 360°. Убери полные обороты, затем найди на окружности синус оставшегося угла.'),
 'practice-temperature': ({stepIndex,task})=>stepIndex===1&&task?.params?.c<0
   ?nextStep('Прибавь 32 к уже найденному отрицательному слагаемому.', 'signs')
   :null,
 'practice-fraction-expression': ({stepIndex})=>stepIndex===1
   ?nextStep('После деления приведи слагаемые к общему знаменателю.', 'fractions')
   :null,
 'practice-fraction-divide': nextStep('Запиши дробь, на которую делишь. Поменяй в ней местами числитель и знаменатель и замени деление умножением.'),
 'practice-fraction-percent': nextStep('Прими целое за 100%. Сначала запиши данную долю десятичной дробью, затем умножь её на 100.', 'percent'),
 'practice-percent-change': nextStep('Сначала найди процент от исходной цены. Затем по условию прибавь его денежное значение или вычти.', 'change'),
 'practice-percent-reverse': nextStep('Прими прежнюю цену за 100%. Сколько процентов старой цены осталось после скидки?', 'change')
};
// These external trainers rehearse the operation actually required by the
// family. Mixed tasks use the authored in-place step instead of a category tag.
const examSkills={
 'practice-fraction-add':'fractions',
 percent:'change',
 'practice-percent-part':'percent',
 'practice-percent-whole':'percent',
 'practice-percent-rate':'percent',
 'practice-percent-chain':'change',
 'practice-direct-proportion':'proportion',
 'practice-inverse-proportion':'proportion',
 powers:'powers',
 'practice-root-product':'powers',
 'practice-power-rules':'powers',
 'equations-linear':'equations',
 'equations-signs':'equations',
 'equations-fractions':'equations',
 'equations-brackets':'equations'
};
const gapRoutes={fractions:'fractions',fraction:'share',percent:'choice',change:'percent',proportion:'ratio',division:'ratio',equations:'equations',powers:'powers',signs:'numberline'};
function specificRoute(id,context){
 const route=Object.hasOwn(targeted,id)?targeted[id]:null;
 return typeof route==='function'?route(context):route;
}
function numeric(s){const m=String(s).trim().replace('−','-').replace(',','.').match(/^([+-]?[\d.]+)(?:\s*\/\s*([+-]?[\d.]+))?$/);if(!m||m[2]!==undefined&&+m[2]===0)return null;const n=+m[1]/(m[2]===undefined?1:+m[2]);return Number.isFinite(n)?n:null;}
function examRoute(id,task,stepIndex){
 if(!task?.steps?.length)return null;
 const linearVariant=id==='equations'&&task.model?.kind==='equation';
 const familySkill=Object.hasOwn(examSkills,id)?examSkills[id]:null;
 const key=linearVariant?'equations':familySkill;
 if(!key&&stepIndex!==undefined)return null;
 const index=stepIndex??0;
 const why=root.PathTaskHints?.hint(task,index)||task.steps[index]?.q;
 if(!why)return null;
 return key?{key,why,...skills[key]}:nextStep(why);
}
function recommend(context){
 const {id,value,expected,meta,task,stepIndex}=context;
 // Concrete input errors take precedence over the broad exam task family.
 const n=numeric(value);
 if(/\/\s*[+-]?0(?:[.,]0*)?\s*$/.test(String(value)))return {key:'part',...skills.part,why:'У дроби не может быть нулевого знаменателя. Вспомним, что означает деление целого на части.'};
 if(Number.isFinite(expected)&&expected!==0&&n!==null&&Math.abs(n+expected)<1e-7)return {key:'signs',...skills.signs,why:'Получился ответ с противоположным знаком. Возможно, стоит проверить действие со знаками.'};
 const routine=specificRoute(id,context);
 if(routine){
  if(routine.key)return {...routine,...skills[routine.key]};
  return stepIndex===undefined?routine:null;
 }
 if(meta?.pos&&!meta.grade7&&!meta.pre7)return examRoute(id,task,stepIndex);
 const family=meta?.expanded?gapRoutes[meta.gap]||id:id;
 let key,why;
 if(family==='percent'){key='change';why='На этом шаге важно, от какого числа считаются проценты: после изменения база может стать другой.';}
 else if(family==='choice'||family==='mixtures'){key='percent';why='Здесь помогает связь процента, части и целого. Проверь, какая величина принята за 100%.';}
 else if(['fractions','share','gardens'].includes(family)){key='fractions';why='Для этого шага нужны доли одного целого и действия с дробями. Можно отдельно потренировать общий знаменатель.';}
 else if(['joint','reverse','delay','leave'].includes(family)){key='part';why='Время на всю работу и доля работы за час — разные величины. Вспомним смысл единичной дроби.';}
 else if(['crew','minimum','ratio','motion','practical','scale'].includes(family)){key='proportion';why='Сначала установи, как связаны величины: увеличение одной не всегда увеличивает другую.';}
 else if(family==='equations'||family==='expressions'){key='equations';why='Если трудно выполнить преобразование, можно вернуться к простому уравнению и действию с обеими частями.';}
 else if(['powers','functions','triangle','circle','roundbody','pyramid'].includes(family)){key='powers';why='В этом шаге используются степени или корни. Проверь базовое действие отдельно от всей задачи.';}
 else if(family==='numberline'){key='line';why='Вспомним порядок чисел на прямой и положение отрицательных чисел.';}
 if(!key)return null;return {key,...skills[key],why};
}
function clear(){document.getElementById('ege-remediation')?.remove();}
function show(context){
 const hint=recommend(context);
 clear();
 if(!hint)return;
 const feedback=context.feedback||document.getElementById('feedback');
 if(!feedback)return;
 const box=document.createElement('aside');
 box.id='ege-remediation';
 box.className='callout';
 box.setAttribute('aria-label','Вспомнить нужный навык');
 const title=document.createElement('strong');
 title.textContent=hint.path?'Можно потренировать этот навык':'Проверь следующий шаг';
 const text=document.createElement('p');
 text.textContent=hint.why;
 box.append(title,text);
 if(hint.path){
  const link=document.createElement('a');
  link.className='btn';
  link.textContent=hint.title+' →';
  const offline=location.protocol==='file:';
  const storageNotice=document.getElementById('storage');
  const keepTab=offline||Boolean(storageNotice&&!storageNotice.hidden);
  const url=new URL(hint.path,offline?'https://mathexam.space':location.origin);
  if(!keepTab){
   // The separate practice has its own storage key. Returning without this
   // exact mode would open course progress instead of the saved attempt.
   const separate=location.pathname==='/ege-baza/path/index.html'&&new URLSearchParams(location.search).get('practice')==='recovery';
   url.searchParams.set('returnTo',location.pathname+(separate?'?practice=recovery':'')+location.hash);
  }
  link.href=url.href;
  const note=document.createElement('p');
  note.className='muted';
  if(keepTab){
   link.target='_blank';
   link.rel='noopener';
   note.textContent='Тренажёр откроется в новой вкладке. Текущая работа останется здесь.';
  }else{
   note.textContent='Вернись кнопкой в тренажёре. Твоя запись останется в задаче.';
  }
  box.append(link,note);
 }else if(context.openSteps){
  const button=document.createElement('button');
  button.type='button';
  button.textContent='Открыть разбор этой задачи';
  button.onclick=context.openSteps;
  box.append(button);
 }
 feedback.after(box);
}
const api={skills,recommend,numeric,show,clear};root.EgeRemediation=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
