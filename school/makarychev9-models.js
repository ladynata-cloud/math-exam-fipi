(function(root){
'use strict';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function value(p,x){if(p.type==='line')return p.a*x+p.k;if(p.type==='inverse')return x===p.h?null:p.a/(x-p.h)+p.k;return p.a*(x-p.h)**2+p.k;}
function signs(p,x){if(p.type==='quotient-left')return x===p.left?null:(x-p.right)/(x-p.left);if(p.type==='quotient')return x===p.right?null:(x-p.left)/(x-p.right);if(p.type==='even')return (x-p.left)**2*(x-p.right);return (x-p.left)*(x-p.right);}
function sequence(p){const values=[p.first];for(let i=1;i<p.count;i++)values.push(p.type==='geometric'?values[i-1]*p.change:values[i-1]+p.change);return {values,sum:values.reduce((a,b)=>a+b,0)};}
function mount(el,m,M,old){
 if(m.kind!=='m9lab')return old(el,m);
 const family=m.family,d=m.data,p={type:family==='graph'?'parabola':family==='signs'?'product':family==='sequence'?'arithmetic':'region',a:1,h:0,k:0,x:2,y:1,left:-2,right:3,op:'≥',first:2,change:3,count:5,exact:20,approx:19,selected:[false,false,false],ends:[false,false],reveal:false,showGraph:false,showTarget:false};
 const rootLesson=m.key==='root-square';
 const startingGraph=['inverse','rational-shift','rational-point'].includes(m.key)?'inverse':m.key==='read-graph'?'line':'parabola';
 if(family==='graph')p.type=startingGraph;
 if(rootLesson){p.type='root';p.x=-3;}
 if(m.key==='interval-rational')p.type='quotient-left';
 if(m.key==='interval-even')p.type='even';
 const target={a:d.sgn*(d.c||2),h:d.h,k:d.b};let status='',success=false,mission=0,drawing=false,sumInput='',errorInput='',rootInput='';
 // Restore only known, bounded controls; persisted work never supplies HTML or callbacks.
 if(m.state&&typeof m.state==='object'){for(const key of Object.keys(p)){const v=m.state[key];if(typeof p[key]==='boolean'&&typeof v==='boolean')p[key]=v;else if(Array.isArray(p[key])&&Array.isArray(v)&&v.length===p[key].length&&v.every(x=>typeof x==='boolean'))p[key]=v.slice();else if(typeof p[key]==='number'&&Number.isFinite(v)&&Math.abs(v)<=100)p[key]=v;}const types=family==='graph'?['line','inverse','parabola']:family==='signs'?['product','quotient','quotient-left','even']:family==='systems'?['region','circle']:family==='sequence'?['arithmetic','geometric']:rootLesson?['root','region']:[];if(types.includes(m.state.type))p.type=m.state.type;if(['≥','>','≤','<'].includes(m.state.op))p.op=m.state.op;for(const [key,lo,hi]of [['a',-4,4],['h',-6,6],['k',-6,6],['x',-10,10],['y',-10,10],['left',-8,0],['right',1,8],['first',-5,5],['change',-3,3],['count',2,8],['exact',1,100],['approx',0,100]])p[key]=Math.max(lo,Math.min(hi,p[key]));p.count=Math.round(p.count);}
 if(m.state){rootInput=typeof m.state.rootInput==='string'?m.state.rootInput.slice(0,30):'';if(Number.isInteger(m.state.mission)&&m.state.mission>=0&&m.state.mission<=1000){mission=m.state.mission;if(mission){target.h=(d.h+mission+4)%9-4;target.k=(d.b+mission)%7-3;target.a=[-4,-2,-1,1,2,4][mission%6];}}sumInput=typeof m.state.sumInput==='string'?m.state.sumInput.slice(0,30):'';errorInput=typeof m.state.errorInput==='string'?m.state.errorInput.slice(0,30):'';status=typeof m.state.status==='string'?m.state.status.slice(0,300):'';success=m.state.success===true;}
 const snapshot=()=>Object.assign({},p,{selected:p.selected.slice(),ends:p.ends.slice(),mission,sumInput,errorInput,rootInput,status,success});
 const display=n=>Number.isInteger(n)?String(n):'≈ '+String(Math.round(n*1000)/1000);
 const ctl=(key,label,min,max,step=1)=>`<label>${label}<input data-param="${key}" type="number" min="${min}" max="${max}" step="${step}" value="${p[key]}"></label>`;
 const opt=(key,label,list)=>`<label>${label}<select data-param="${key}">${list.map(([v,t])=>`<option value="${v}" ${p[key]===v?'selected':''}>${t}</option>`).join('')}</select></label>`;
 const button=(text,act)=>`<button type="button" class="quiet" data-lab-action="${act}">${text}</button>`;
 const X=x=>300+20*x,Y=y=>260-20*y;
 function grid(body,label){let s='';for(let n=-12;n<=12;n++){s+=`<path d="M ${X(n)} 20 V 500 M 60 ${Y(n)} H 540" class="m9-grid"/>`;if(n%4===0&&n!==0)s+=`<text x="${X(n)}" y="278">${n}</text><text x="275" y="${Y(n)}">${n}</text>`;}return `<svg class="m9-coordinate" viewBox="0 0 600 530" role="img" aria-label="${esc(label)}">${s}<path d="M60 260H550 M300 510V10" class="m9-axis"/><text x="553" y="255">x</text><text x="309" y="20">y</text><defs><clipPath id="m9-clip"><rect x="60" y="20" width="480" height="480"/></clipPath></defs><g clip-path="url(#m9-clip)">${body}</g></svg>`;}
 function curve(fn=x=>value(p,x)){let path='',pen=false,prev=null;for(let i=0;i<=600;i++){const x=-12+i*.04,y=fn(x);if(y===null||!Number.isFinite(y)||Math.abs(y)>13||prev!==null&&Math.abs(y-prev)>8){pen=false;prev=y;continue;}path+=(pen?'L':'M')+X(x).toFixed(1)+' '+Y(y).toFixed(1);pen=true;prev=y;}return `<path d="${path}" class="m9-curve"/>`;}
 function point(x,y,label,cls='m9-point'){return `<circle cx="${X(x)}" cy="${Y(y)}" r="7" class="${cls}"/><text x="${X(x)+10}" y="${Y(y)-12}">${esc(label)}</text>`;}
 function graphMission(){
  if(p.type==='line'){
   return {
    prompt:`Построй прямую через точки (0;${target.k}) и (1;${target.k+target.a}). Подбери a и k.`,
    points:point(0,target.k,'Первая точка','m9-target')+point(1,target.k+target.a,'Вторая точка','m9-target'),
    correct:p.k===target.k&&p.a===target.a,
    hint:p.k!==target.k?'При x=0 значение y равно k. Найди его по первой точке.':'Сравни значения y в двух точках. На сколько поднялась или опустилась прямая при шаге вправо на единицу?',
    result:'Построение верно. Обе точки принадлежат прямой.'
   };
  }
  if(p.type==='inverse'){
   return {
    prompt:`Построй гиперболу с асимптотами x=${target.h} и y=${target.k}, проходящую через (${target.h+1};${target.k+target.a}). Подбери h, k и a.`,
    points:point(target.h,target.k,'Центр','m9-target')+point(target.h+1,target.k+target.a,'Точка','m9-target'),
    correct:p.h===target.h&&p.k===target.k&&p.a===target.a,
    hint:p.h!==target.h||p.k!==target.k?'Проверь сдвиги: при x=h знаменатель равен нулю, а при больших |x| график приближается к y=k.':'При x=h+1 знаменатель равен 1. Как связаны a и высота заданной точки над прямой y=k?',
    result:'Построение верно. Обе асимптоты совпали, заданная точка лежит на гиперболе.'
   };
  }
  return {
   prompt:`Построй параболу с вершиной (${target.h};${target.k}), которая проходит через (${target.h+1};${target.k+target.a}). Подбери a, h и k.`,
   points:point(target.h,target.k,'Вершина','m9-target')+point(target.h+1,target.k+target.a,'Точка','m9-target'),
   correct:p.h===target.h&&p.k===target.k&&p.a===target.a,
   hint:p.h!==target.h||p.k!==target.k?'Сначала установи вершину: h — её абсцисса, k — ордината.':'Вершина верна. На единицу правее квадрат скобки равен 1: сравни высоту точки с k, чтобы найти a.',
   result:'Построение верно: вершина совпала, а точка на единицу правее имеет нужную высоту.'
  };
 }
 function draw(){if(drawing)return;drawing=true;let title='',description='',controls='',body='',challenge='',actions='';
 if(family==='graph'){
  title='График в твоих руках';description='Меняй коэффициенты и сравнивай формулу с движением графика. Для параболы можно указать вершину щелчком на сетке или перетащить её; те же действия доступны числовыми полями и стрелками клавиатуры.';
  controls=opt('type','Исследуем',[['parabola','Парабола'],['line','Прямая'],['inverse','Гипербола']])+ctl('a','Коэффициент a',-4,4)+(p.type==='line'?'':ctl('h','Сдвиг h',-6,6))+ctl('k','Сдвиг k',-6,6)+ctl('x','Аргумент для проверки',-8,8);
  const y=value(p,p.x),formula=p.type==='parabola'?`y=${p.a}(x−(${p.h}))²+(${p.k})`:p.type==='inverse'?`y=${p.a}/(x−(${p.h}))+(${p.k})`:`y=${p.a}x+(${p.k})`;
  const domain=p.type==='inverse'?`Область определения: x ≠ ${p.h}. ${p.a===0?`При a=0: y=${p.k}, но точка (${p.h}; ${p.k}) исключена. Вертикальной асимптоты нет.`:`Асимптоты: x=${p.h}, y=${p.k}.`}`:'Область определения: все действительные x.';
  const excluded=p.type==='inverse'&&p.a===0?point(p.h,p.k,'исключена','m9-open'):'';
  const asymptotes=p.type==='inverse'&&p.a!==0?`<path data-asymptotes="true" d="M${X(p.h)} 20V500 M60 ${Y(p.k)}H540" stroke="#869a94" stroke-dasharray="6 5" fill="none"/>`:'';
  const samples=p.type==='line'?[-1,0,1]:[p.h-1,p.h,p.h+1],goal=graphMission();
  body=`<p class="m9-formula">${esc(formula)}</p>`+grid(asymptotes+curve()+excluded+(p.type==='parabola'&&p.a!==0?point(p.h,p.k,'V'):'')+(p.showTarget?goal.points:''),formula)+`<p class="m9-domain">${domain}</p><p class="m9-value">При x=${p.x}: y ${y===null?'не определено':Number.isInteger(y)?'= '+y:display(y)}.</p><table class="m9-value-table"><caption>Та же формула — три контрольных значения</caption><tr><th>x</th>${samples.map(x=>`<td>${x}</td>`).join('')}</tr><tr><th>y</th>${samples.map(x=>{const v=value(p,x);return `<td>${v===null?'не определено':display(v)}</td>`;}).join('')}</tr></table>`;
  challenge=goal.prompt;actions=button('Проверить построение','graph-check')+button('Показать контрольные точки','target')+button('Новая миссия','new-mission')+button('Вернуться к исходному графику','reset');
 }else if(family==='signs'){
  title='Собери решение на числовой прямой';description='Отметь все подходящие промежутки и отдельно реши, включать ли каждую границу. Если нужно, исследуй знаки в пробных точках.';
  controls=opt('type','Выражение',[['product','(x−l)(x−r)'],['quotient','(x−l)/(x−r)'],['quotient-left','(x−r)/(x−l)'],['even','(x−l)²(x−r)']])+ctl('left','Граница l',-8,0)+ctl('right','Граница r',1,8)+opt('op','Сравнение с нулём',[['≥','≥ 0'],['>','> 0'],['≤','≤ 0'],['<','< 0']]);
  const labels=[`(−∞; ${p.left})`,`(${p.left}; ${p.right})`,`(${p.right}; +∞)`],samples=[p.left-1,(p.left+p.right)/2,p.right+1];
  const divisions=[30,190,410,575];
  const sections=p.selected.map((chosen,i)=>`<path data-chosen-interval="${i}" d="M${divisions[i]} 50H${divisions[i+1]}" stroke="#236959" stroke-width="6" visibility="${chosen?'visible':'hidden'}"/>`).join('');
  const boundaries=[p.left,p.right].map((n,i)=>`<circle data-chosen-end="${i}" cx="${divisions[i+1]}" cy="50" r="7" class="${p.ends[i]?'m9-point':'m9-open'}"/><text x="${divisions[i+1]}" y="85">${n}</text>`).join('');
  body=`<svg viewBox="0 0 600 110" role="img" aria-label="Выбранные промежутки и границы на числовой прямой"><path d="M30 50H575" class="m9-axis"/>${sections}${boundaries}</svg><div class="m9-intervals">${labels.map((s,i)=>`<button type="button" data-interval="${i}" aria-pressed="${p.selected[i]}">${s}</button>`).join('')}</div><div class="row">${[p.left,p.right].map((n,i)=>`<label><input type="checkbox" data-end="${i}" ${p.ends[i]?'checked':''}>Включить ${n}</label>`).join('')}</div>`;
  if(p.showGraph)body+=grid(curve(x=>signs(p,x)),'График выражения: над осью значения положительны, под осью отрицательны')+'<p>Над осью x выражение положительно, под осью — отрицательно. Сравни график с выбранными промежутками. Вертикальные разрывы не соединяются.</p>';
  if(p.reveal)body+='<table><caption>Пробные точки — по одной на каждом промежутке</caption><tr><th>x</th>'+samples.map(x=>`<td>${x}</td>`).join('')+'</tr><tr><th>Значение</th>'+samples.map(x=>`<td>${Math.round(signs(p,x)*1000)/1000}</td>`).join('')+'</tr></table>';
  challenge=`Выбери всё множество решений ${p.type==='product'?`(x−(${p.left}))(x−${p.right})`:p.type==='quotient'?`(x−(${p.left}))/(x−${p.right})`:p.type==='quotient-left'?`(x−${p.right})/(x−(${p.left}))`:`(x−(${p.left}))²(x−${p.right})`} ${p.op} 0.`;actions=button('Связать с графиком','show-graph')+button('Показать пробные точки','reveal')+button('Проверить выбранное множество','sign-check');
 }else if(family==='systems'){
  title='Пара координат должна пройти все условия';description='Перемещай точку по сетке мышью или меняй обе координаты полями. Проверка рассматривает каждое условие отдельно.';
  controls=opt('type','Исследуем',[['region','Пересечение полуплоскостей'],['circle','Окружность и прямая']])+ctl('x','Координата x',-10,10)+ctl('y','Координата y',-10,10);
  const shape=p.type==='region'?`<path d="M${X(0)} ${Y(0)}L${X(6)} ${Y(0)}L${X(0)} ${Y(6)}Z" class="m9-area"/>`:`<circle cx="300" cy="260" r="100" class="m9-circle"/><path d="M60 ${Y(3)}H540" class="m9-curve"/>`;
  body=grid(shape+point(p.x,p.y,`(${p.x};${p.y})`),'Точка и общая область системы');
  challenge=p.type==='region'?'Поставь точку так, чтобы x≥0, y≥0 и x+y≤6. Потом проверь точку на границе.':'Найди точку, которая одновременно лежит на x²+y²=25 и y=3. Сможешь найти вторую?';actions=button('Проверить точку','system-check');
 }else if(family==='sequence'){
  title='Собери последовательность и её сумму';description='Номер — это место в ряду, значение — высота точки. Сравни прибавление одной разности и умножение на один знаменатель.';
  controls=opt('type','Правило',[['arithmetic','Прибавлять d'],['geometric','Умножать на q']])+ctl('first','Первый член',-5,5)+ctl('change','Разность d / знаменатель q',-3,3)+ctl('count','Число членов',2,8);
  const s=sequence(p),max=Math.max(1,...s.values.map(Math.abs)),scale=130/max;
  body=`<svg viewBox="0 0 600 340" role="img" aria-label="Последовательность по номерам"><path d="M35 170H580" class="m9-axis"/>${s.values.map((y,i)=>`<path d="M${65+i*64} 170V${170-y*scale}" class="m9-curve"/><circle cx="${65+i*64}" cy="${170-y*scale}" r="5" class="m9-point"/><text x="${65+i*64}" y="325">${i+1}</text><text x="${65+i*64}" y="${155-y*scale}">${y}</text>`).join('')}</svg><p>Горизонтально — номер; вертикально — значение. Масштаб высоты подстраивается. Между членами нет промежуточных номеров.</p><p>Члены: ${s.values.join('; ')}.</p>`;
  challenge='Предскажи сумму всех показанных членов. Для арифметической прогрессии попробуй соединять первый и последний.';actions='<label>Твоя сумма<input data-sum type="text" inputmode="decimal"></label>'+button('Проверить сумму','sum-check')+button('Показать объяснение суммы','sum-reveal');if(p.reveal)body+=`<p class="m9-explanation">${p.type==='arithmetic'?`Среднее крайних: (${s.values[0]}+(${s.values.at(-1)}))/2. Умножаем на ${p.count}.`:p.change===1?`Все ${p.count} членов равны ${p.first}.`:`Вычти исходную сумму из суммы, умноженной на ${p.change}: промежуточные члены сократятся.`} Сумма = ${s.sum}.</p>`;
 }else if(rootLesson&&p.type==='root'){
  title='Квадратный корень и расстояние до нуля';
  description='Выбери число x. Посмотри, сколько единиц отделяет его от нуля. Проверь своё предположение для отрицательного числа, нуля и положительного числа.';
  controls=opt('type','Опыт',[['root','Корень из квадрата'],['region','Погрешность измерения']])+ctl('x','Число x',-10,10);
  const position=300+24*p.x;
  body=`<svg viewBox="0 0 600 110" role="img" aria-label="Числовая прямая. Отрезок между нулём и числом ${p.x}"><path d="M40 48H560" class="m9-axis"/><path d="M300 48H${position}" class="m9-curve"/><path d="M300 40V56" class="m9-axis"/><circle cx="${position}" cy="48" r="6" class="m9-point"/><text x="300" y="83">0</text><text x="${position}" y="28">x = ${p.x}</text></svg><p>Квадрат выбранного числа равен ${p.x**2}.</p>`;
  challenge=`Чему равен √(${p.x<0?'('+p.x+')':p.x}²)?`;
  actions='<label>Твоё значение корня<input data-root type="text" inputmode="decimal"></label>'+button('Проверить корень','root-check');
 }else{
  title='Насколько близко приближение';description='Измерь расстояние между точным и приближённым значениями. Сравни одну и ту же абсолютную ошибку для малых и больших чисел.';
  controls=(rootLesson?opt('type','Опыт',[['root','Корень из квадрата'],['region','Погрешность измерения']]):'')+ctl('exact','Точное значение',1,100,.1)+ctl('approx','Приближённое',0,100,.1);
  const lo=Math.min(p.exact,p.approx)-2,hi=Math.max(p.exact,p.approx)+2,map=x=>50+(x-lo)/(hi-lo)*500;
  body=`<svg viewBox="0 0 600 180" role="img" aria-label="Расстояние между значениями"><path d="M30 90H575" class="m9-axis"/><path d="M${map(p.exact)} 70H${map(p.approx)}" class="m9-curve"/><circle cx="${map(p.exact)}" cy="90" r="7" class="m9-point"/><text x="${map(p.exact)}" y="135">Точно ${p.exact}</text><circle cx="${map(p.approx)}" cy="90" r="7" class="m9-open"/><text x="${map(p.approx)}" y="40">≈ ${p.approx}</text></svg>`;
  challenge='Найди абсолютную погрешность. Затем поменяй местами точное и приближённое значения: расстояние сохранится, относительная погрешность может измениться.';actions='<label>Абсолютная погрешность<input data-error type="text" inputmode="decimal"></label>'+button('Проверить расстояние','error-check');
 }
 el.innerHTML=`<section class="m9-lab"><p class="eyebrow">Исследуй сам · ${family==='graph'?'строй и проверяй':'сделай выбор'}</p><h2>${title}</h2><p>${description}</p><p class="tiny">Отдельная лаборатория: её настройки не меняют условие тренировочной задачи и не засчитываются как самостоятельное освоение.</p><div class="m9-controls">${controls}</div><div class="m9-canvas">${body}</div><div class="m9-mission"><h3>Твоя миссия</h3><p>${challenge}</p><div class="row">${actions}</div><p class="m9-status ${success?'good':''}" role="status">${esc(status)}</p></div></section>`;
 for(const [selector,key]of [['[data-sum]','sum'],['[data-error]','error'],['[data-root]','root']]){const input=el.querySelector(selector);if(input){input.value=key==='sum'?sumInput:key==='root'?rootInput:errorInput;input.oninput=()=>{if(key==='sum')sumInput=input.value.slice(0,30);else if(key==='root')rootInput=input.value.slice(0,30);else errorInput=input.value.slice(0,30);success=false;status='';el.querySelector('.m9-status').textContent='';el.querySelector('.m9-status').classList.remove('good');if(typeof m.onState==='function')m.onState(snapshot());};}}
 el.querySelectorAll('[data-param]').forEach(input=>input.onchange=()=>{if(drawing||!input.isConnected)return;let key=input.dataset.param,v=input.tagName==='SELECT'?input.value:Number(input.value);if(input.tagName!=='SELECT'){if(!Number.isFinite(v))v=0;v=Math.min(Number(input.max),Math.max(Number(input.min),v));if(input.step==='1')v=Math.round(v);}if(rootLesson&&key==='x'&&p.x!==v)rootInput='';p[key]=v;p.selected=[false,false,false];p.ends=[false,false];p.reveal=false;status='';success=false;draw();el.querySelector(`[data-param="${key}"]`)?.focus();});
 el.querySelectorAll('[data-interval]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.interval);p.selected[i]=!p.selected[i];el.querySelector('[data-chosen-interval="'+i+'"]').setAttribute('visibility',p.selected[i]?'visible':'hidden');success=false;status='';el.querySelector('.m9-status').classList.remove('good');if(typeof m.onState==='function')m.onState(snapshot());b.setAttribute('aria-pressed',String(p.selected[i]));status='';el.querySelector('.m9-status').textContent='';});
 el.querySelectorAll('[data-end]').forEach(b=>b.onchange=()=>{p.ends[Number(b.dataset.end)]=b.checked;el.querySelector('[data-chosen-end="'+b.dataset.end+'"]').setAttribute('class',b.checked?'m9-point':'m9-open');success=false;status='';el.querySelector('.m9-status').classList.remove('good');if(typeof m.onState==='function')m.onState(snapshot());el.querySelector('.m9-status').textContent='';});
 const svg=el.querySelector('.m9-coordinate');
 if(svg&&(family==='systems'||family==='graph'&&p.type==='parabola')){
  let dragging=false;
  function move(event){
   const pointer=svg.createSVGPoint();
   pointer.x=event.clientX;pointer.y=event.clientY;
   const local=pointer.matrixTransform(svg.getScreenCTM().inverse());
   const limit=family==='systems'?10:6;
   const clamp=value=>Math.max(-limit,Math.min(limit,Math.round(value)));
   const x=clamp((local.x-300)/20),y=clamp((260-local.y)/20);
   const [horizontal,vertical]=family==='systems'?['x','y']:['h','k'];
   if(p[horizontal]===x&&p[vertical]===y)return;
   p[horizontal]=x;p[vertical]=y;
   for(const key of [horizontal,vertical])el.querySelector('[data-param='+key+']').value=p[key];
   status='';success=false;
   el.querySelector('.m9-status').textContent='';
   el.querySelector('.m9-status').classList.remove('good');
   if(family==='systems'){
    const dot=svg.querySelector('.m9-point'),label=dot.nextElementSibling;
    dot.setAttribute('cx',X(x));dot.setAttribute('cy',Y(y));
    label.setAttribute('x',X(x)+10);label.setAttribute('y',Y(y)-12);label.textContent=`(${x};${y})`;
   }else{
    svg.querySelector('g[clip-path]').innerHTML=curve()+(p.a!==0?point(p.h,p.k,'V'):'')+(p.showTarget?graphMission().points:'');
    const formula=`y=${p.a}(x−(${p.h}))²+(${p.k})`;
    el.querySelector('.m9-formula').textContent=formula;svg.setAttribute('aria-label',formula);
    const cells=el.querySelectorAll('.m9-value-table td');
    [p.h-1,p.h,p.h+1].forEach((sample,i)=>{cells[i].textContent=sample;cells[i+3].textContent=display(value(p,sample));});
    const ordinate=value(p,p.x);
    el.querySelector('.m9-value').textContent='При x='+p.x+': y '+(Number.isInteger(ordinate)?'= '+ordinate:display(ordinate))+'.';
   }
   if(typeof m.onState==='function')m.onState(snapshot());
  }
  svg.onpointerdown=e=>{if(e.button!==0)return;dragging=true;svg.setPointerCapture(e.pointerId);move(e);};
  svg.onpointermove=e=>{if(dragging)move(e);};
  svg.onpointerup=e=>{if(dragging){move(e);dragging=false;draw();}};
  svg.onpointercancel=()=>{dragging=false;draw();};
 }
 el.querySelectorAll('[data-lab-action]').forEach(b=>b.onclick=()=>{const a=b.dataset.labAction;success=false;
 if(a==='reset'){Object.assign(p,{type:startingGraph,a:1,h:0,k:0});status='';}
 if(a==='graph-check'){const goal=graphMission();success=goal.correct;status=success?goal.result:goal.hint;}
 if(a==='target'){p.showTarget=!p.showTarget;status=p.showTarget?'Контрольные отметки видны на сетке. Сверь их с условием.':'';}
 if(a==='new-mission'){mission=mission%1000+1;target.h=(d.h+mission+4)%9-4;target.k=(d.b+mission)%7-3;target.a=[-4,-2,-1,1,2,4][mission%6];p.showTarget=false;status='Новое условие. Сверь данные на сетке и подбери коэффициенты.';}
 if(a==='show-graph'){p.showGraph=!p.showGraph;status='Сравни высоту графика относительно оси с решением на прямой.';}
 if(a==='reveal'){p.reveal=true;status='Сравни знаки в таблице с требуемым неравенством; отдельно проверь границы.';}
 if(a==='sign-check'){const ok=z=>z!==null&&(p.op==='≥'?z>=0:p.op==='>'?z>0:p.op==='≤'?z<=0:z<0),expected=[p.left-1,(p.left+p.right)/2,p.right+1].map(x=>ok(signs(p,x))),ends=[p.left,p.right].map(x=>ok(signs(p,x)));success=expected.every((x,i)=>x===p.selected[i])&&ends.every((x,i)=>x===p.ends[i]);const quotient=p.type==='quotient'||p.type==='quotient-left';
  if(success)status='Верно. Выбраны все подходящие промежутки и границы.';
  else if(expected.some((x,i)=>x!==p.selected[i])){
   status=quotient?'Проверь знаки числителя и знаменателя на каждом промежутке. Одинаковые знаки дают плюс, разные дают минус.':p.type==='even'?'Множитель в квадрате положителен по обе стороны своего нуля. Что задаёт знак произведения между границами?':'Проверь знаки обоих множителей на каждом промежутке. Одинаковые знаки дают плюс, разные дают минус.';
  }else if(quotient){
   const pole=p.type==='quotient'?p.right:p.left;
   status=`Промежутки верны. При x=${pole} получаем нуль знаменателя. Эту точку всегда исключаем. У нуля числителя проверь строгость неравенства.`;
  }else status='Промежутки верны. На обеих границах произведение равно нулю. Сравни ноль с правой частью, учитывая знак неравенства.';}
 if(a==='system-check'){const checks=p.type==='circle'?[p.x*p.x+p.y*p.y===25,p.y===3]:[p.x>=0,p.y>=0,p.x+p.y<=6];success=checks.every(Boolean);status=(success?'Подходит. ':'Пока не подходит. ')+(p.type==='circle'?`x²+y²=${p.x*p.x+p.y*p.y} (нужно 25); y=${p.y} (нужно 3).`:`x≥0: ${checks[0]?'да':'нет'}; y≥0: ${checks[1]?'да':'нет'}; x+y≤6: ${checks[2]?'да':'нет'}.`);}
 if(a==='sum-check'){success=M.equal(el.querySelector('[data-sum]').value,sequence(p).sum);status=success?'Сумма верна. Теперь измени правило или знак и предскажи, как изменится ряд.':'Проверь количество слагаемых и знаки; последний член — не вся сумма.';}
 if(a==='sum-reveal'){p.reveal=true;status='Разбор открыт. Для самостоятельной проверки выбери другие параметры.';}
 if(a==='root-check'){
  const root=Math.abs(p.x);
  const prediction=M.parse(rootInput);
  success=M.equal(rootInput,root);
  status=success?`Верно. √${p.x**2} = ${root}. Расстояние от ${p.x} до нуля равно |${p.x}| = ${root}.`:!prediction?'Введи одно число.':prediction.n<0?'Проверь знак. Может ли расстояние до нуля быть отрицательным?':'Найди неотрицательное число, которое в квадрате даёт '+(p.x**2)+'.';
 }
 if(a==='error-check'){const error=Math.round(Math.abs(p.exact-p.approx)*1e8)/1e8;success=M.equal(el.querySelector('[data-error]').value,error);status=success?`Верно. Относительная погрешность ≈ ${Math.round(error/p.exact*10000)/100}%: делим расстояние на точное значение.`:'Нужен модуль разности: расстояние не может быть отрицательным.';}
 draw();el.querySelector('[data-lab-action="'+a+'"]').focus({preventScroll:true});el.querySelector('.m9-status').scrollIntoView({block:'nearest',behavior:'auto'});
 });
 drawing=false;if(typeof m.onState==='function')m.onState(snapshot());
 }
 draw();
}
function install(V,M){const old=V.mount;V.mount=(el,m)=>mount(el,m,M,old);}
const API={value,signs,sequence,mount,install};if(typeof module!=='undefined'&&module.exports)module.exports=API;else{root.WorkshopM9Models=API;install(root.WorkshopModels,root.WorkshopMath);}
})(typeof window!=='undefined'?window:globalThis);
