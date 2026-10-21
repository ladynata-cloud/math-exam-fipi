/* Inline discovery models for the eight existing OGE 1–5 storylines.
 * This layer never reads answer keys and never writes a learner answer or score.
 * Models use their own explicitly labelled example numbers. */
(function(global){
'use strict';
const doc=global.document,green='#176747',blue='#245ca6',amber='#a65b13';
const q=(s,r=doc)=>r.querySelector(s),qa=(s,r=doc)=>Array.from(r.querySelectorAll(s));
const fmt=n=>Number(n.toFixed(2)).toLocaleString('ru-RU');
const precise=n=>Number(n.toFixed(6)).toLocaleString('ru-RU',{maximumFractionDigits:6});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const frac=(a,b)=>'<span class="pm-fraction"><span>'+a+'</span><span>'+b+'</span></span>';
let serial=0;
const memory=new Map();
function element(tag,text,cls){const e=doc.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;}
function details(label,body){const d=element('details',null,'pm-details pd-more');d.append(element('summary',label));const c=element('div',null,'pm-content');d.append(c);if(body)c.append(body);return d;}
function range(host,key,label,min,max,value,step=1){const lab=element('label',null,'pd-control');const txt=element('span',label);const out=element('output',fmt(value));const input=doc.createElement('input');input.type='range';input.min=min;input.max=max;input.step=step;input.value=value;input.dataset.pdKey=key;input.setAttribute('aria-label',label);lab.append(txt,out,input);host.append(lab);input.addEventListener('input',()=>out.textContent=fmt(Number(input.value)));return input;}
function select(host,key,label,options){const lab=element('label',label,'pd-control');const input=doc.createElement('select');input.dataset.pdKey=key;input.setAttribute('aria-label',label);for(const [v,t] of options){const o=element('option',t);o.value=v;input.append(o);}lab.append(input);host.append(lab);return input;}
function button(host,text,action){const b=element('button',text,'pd-action');b.type='button';b.addEventListener('click',action);host.append(b);return b;}
function picture(host,label){const box=element('div',null,'pd-picture');box.setAttribute('aria-label',label);box.tabIndex=0;host.append(box);const zoom=button(host,'Увеличить модель',()=>{const large=zoom.getAttribute('aria-pressed')!=='true';zoom.setAttribute('aria-pressed',String(large));zoom.textContent=large?'Уменьшить модель':'Увеличить модель';box.classList.toggle('pd-picture-zoomed',large);note.hidden=!large;});zoom.dataset.pdChoice='zoom';zoom.setAttribute('aria-pressed','false');const note=element('p','Рисунок можно прокручивать вправо и влево.','pd-note');note.hidden=true;host.append(note);return body=>box.innerHTML='<svg viewBox="0 0 360 230" role="img" aria-label="'+esc(label)+'">'+body+'</svg>'; }
function line(x1,y1,x2,y2,color=green,width=4){return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}"/>`;}
function text(x,y,s,color=green,anchor='middle'){return `<text x="${x}" y="${y}" fill="${color}" text-anchor="${anchor}" font-size="19">${esc(s)}</text>`;}
function output(host){const out=element('p',null,'pd-reading');out.setAttribute('aria-live','polite');host.append(out);return s=>out.textContent=s;}
function watch(inputs,draw){for(const input of inputs)input.addEventListener('input',draw);draw();}
function typeFor(page,type,textValue){
 const t=(String(type||'')+' '+String(textValue||'')).toLowerCase();
 if(page==='tires')return /процент|оборот|пробег/.test(t)?'percent':/на сколько|замен|радиус/.test(t)?'wheel-compare':/таблиц|столб|ширин.*устанавл/.test(t)?'lookup':'wheel';
 if(page==='paper-sheets')return /диагонал/.test(t)?'triangle':/масса|массу|пачк/.test(t)?'paper-mass':/отношени/.test(t)?'paper-ratio':'paper';
 if(page==='stoves'){
  if(/радиус|арки|стрелк/.test(t))return /стрелк|высота.*дуги/.test(t)?'arch':'triangle';
  if(/прошл|2018|до снижения|до скидки/.test(t))return 'inverse-percent';
  if(/скидк|процент/.test(t))return 'percent';
  if(/стен/.test(t))return 'walls';
  if(!/сопостав/.test(t)&&/руб|стоимост|дешев|доставк|установк/.test(t))return 'purchase';
  if(/объём|объем/.test(t))return /сопостав|целый/.test(t)?'capacity':'volume';
  if(/площад|пола|пол\b/.test(t))return 'area';
  if(/сопостав/.test(t))return 'lookup';
  return 'purchase';
 }
 if(page==='apartments'){
  if(/процент|4\./.test(t))return 'percent';
  if(/пач|упаков|паркет|плитк|досок/.test(t))return 'packs';
  if(/площадь|площади|3\./.test(t))return 'area';
  if(/интернет|тариф/.test(t))return 'cost';
  if(/стиральн|электроплит|5\./.test(t))return 'compare';
  return 'map';
 }
 if(page==='roads-grid')return /магазин|стоимост|дешев/.test(t)?'purchase':/врем|минут/.test(t)?'journey':/по прямой|расстояни.*прям/.test(t)?'triangle':/километр|шоссе через/.test(t)?'route':'map';
 if(page==='roads'||page==='roads-schema')return ({1:'map',2:'route',3:'triangle',4:'journey',5:'fuel'})[type]||'route';
 if(page==='land'||page==='land-plots')return type==='match'?'land-map':type==='percent'?'percent':type==='tiles'?'packs':type==='econ'?(/краск|покрас|магазин/.test(t)?'packs':'payback'):/расстояни|периметр/.test(t)?'length':'area';
 if(page==='tariffs')return type==='match'||type==='count'?'chart':type==='percent'?(/сколько рублей[\s\S]*2018|прежн.*(?:цен|плат)|восстанов|прошлогод/.test(t)?'inverse-percent':'percent'):type==='switch'?'annual':'cost';
 return 'lookup';
}
const plans={
 map:['Найди опорный объект, затем двигайся по описанию.', 'Нажми кнопки участков: сначала «Вход → коридор», затем «Коридор → комната». Сравни с описанием своей задачи.', 'Проверяй по одной зацепке: вход, соседство, поворот, выход. В ответе соблюдай порядок названий в вопросе.'],
 'land-map':['Ищи связь «внутри».', 'Огород — большой прямоугольник. Узкая теплица находится внутри него. Нажимай кнопки букв: сначала выбери огород, затем теплицу.', 'Положение и форма помогают узнать объект без вычислений. На основном плане найди объекты по описанию и запиши их цифры в порядке таблицы. Буквы этой учебной модели не являются ответом к задаче.'],
 route:['Разбей маршрут на отдельные участки.', 'Нажимай кнопки выбора участков: выбранные отрезки окрасятся. Выбери оба отрезка пути через поворот.', 'Путь через поворот равен сумме двух длин. Прямая дорога между концами — другой маршрут.'],
 journey:['Для каждого участка сначала найди время.', 'Увеличь скорость при той же длине. Что произойдёт со временем? Затем добавь второй участок.', 'Время = расстояние ÷ скорость. При километрах и км/ч получатся часы; умножь на 60, чтобы получить минуты. Времена участков складываются.'],
 triangle:['Найди прямой угол и две стороны рядом с ним.', 'Измени один катет. Нажми «Измерить третью сторону» и сравни её с каждым катетом.', 'Сторона напротив прямого угла — гипотенуза. Её квадрат равен сумме квадратов катетов. Не складывай сами катеты, если нужен путь по прямой.'],
 area:['Отличи длину от площади.', 'Меняй число клеток по длине и ширине, затем сторону клетки. Сравни, как меняются длина и площадь.', 'Площадь одной клетки = сторона · сторона. Сосчитай клетки фигуры и умножь на площадь клетки. Составную фигуру разбей на прямоугольники.'],
 length:['Сначала измерь нужную длину в клетках.', 'Поменяй сторону клетки: число клеток остаётся тем же. Переключай «длина» и «периметр».', 'Длина отрезка = число клеток · сторона клетки. Для периметра сложи длины всех сторон границы.'],
 packs:['Последняя неполная упаковка тоже нужна.', 'Сделай нужное количество кратным размеру упаковки. Потом добавь один предмет. Сколько упаковок стало нужно?', 'Количество упаковок округляют вверх. Но сначала проверь, что и потребность, и вместимость выражены в одинаковых единицах.'],
 percent:['Найди величину, с которой сравнивают: это 100%.', 'Оставь основу неизменной и двигай вторую величину. Сравни «сколько процентов составляет» и «на сколько процентов изменилась».', 'Для доли дели новую величину на основу. Для изменения дели разность на основу. Затем умножь на 100%. Основа — та величина, с которой сравнивают, а не всегда меньшая.'],
 'inverse-percent':['Здесь известен результат изменения, а ищем прежнюю величину.', 'Меняй скидку или рост. Заметь: чтобы вернуться к прежней цене, нужно разделить нынешнюю на коэффициент.', 'После скидки p% остаётся (100 − p)% прежней цены. После роста — (100 + p)%. Прежняя цена = нынешняя ÷ соответствующий коэффициент.'],
 cost:['Отдели постоянную плату от доплат.', 'Меняй расход. Пока он не превысил пакет, доплаты нет. После превышения сравни две полные стоимости.', 'Для каждого варианта сложи все необходимые расходы: покупку, установку, доставку или доплату сверх пакета. Сравни суммы, затем проверь, что спрашивают в ответе.'],
 purchase:['Составь полную стоимость покупки в каждом магазине.', 'Меняй количество товара и доставку. Сравни, всегда ли меньшая цена товара означает меньшие общие расходы.', 'Для каждого магазина умножь цену единицы на количество. Прибавь установку и доставку из условия. Если есть скидки, проверь, на какую часть покупки действует каждая скидка.'],
 compare:['Сначала проверь все ограничения, затем сравни цену.', 'Меняй допустимую ширину. В таблице останутся только подходящие варианты. Из них выбери более дешёвый.', 'Дешёвый вариант может не подходить по размеру, объёму или расходу. В ответ запиши именно то, что спрашивают: номер, стоимость или разницу.'],
 capacity:['Проверь нижнюю и верхнюю границы диапазона.', 'Двигай объём комнаты. Выбери все печи, для которых объём попадает внутрь диапазона, включая границы.', 'Наибольший целый допустимый объём — ближайшее целое число не выше верхней границы. Это другой вопрос, чем выбор печи для заданной комнаты.'],
 volume:['Объём — сколько кубиков помещается внутри.', 'Измени только высоту, оставив пол прежним. Наблюдай, что происходит с объёмом.', 'Сначала площадь пола = длина · ширина. Затем объём = площадь пола · высота. Для площади ответ в м², для объёма — в м³.'],
 walls:['Разверни стены в один прямоугольник.', 'Измени высоту стен, затем площадь двери. Заметь, какую часть нужно вычесть.', 'Общая ширина развёртки стен равна периметру пола: 2·(длина + ширина). Умножь её на высоту, затем вычти площадь двери и других проёмов из условия.'],
 paper:['Каждый следующий формат — половина предыдущего.', 'Нажимай «Разрезать пополам». Сравни число листов и долю одного листа.', 'Один разрез удваивает число листов и вдвое уменьшает площадь каждого. Для форматов Aₘ и Aₙ количество разрезов равно n − m. Размеры в миллиметрах сверяй с условием округления.'],
 'paper-ratio':['У подобных листов отношение соответствующих сторон одинаково.', 'Переключай форматы. Меняются размеры, но отношение длинной стороны к короткой сохраняется.', 'Проверь направление отношения: длинная к короткой или короткая к длинной. Это взаимно обратные числа. В реальных таблицах размеры округлены до миллиметра.'],
 'paper-mass':['Свяжи площадь листа с массой квадратного метра.', 'Измени формат, затем число листов в пачке. Сравни массу одного листа и всей пачки.', 'Масса листа = плотность бумаги · площадь листа. Масса пачки = масса листа · количество листов. Чтобы перевести граммы в килограммы, раздели на 1000.'],
 wheel:['Найди ширину, высоту боковины и диаметр диска.', 'Потяни колесо, чтобы повернуть его. Отметь размеры флажками рядом с моделью, затем измени одно число маркировки. Что изменилось?', 'B — ширина между самыми выпуклыми частями боковин, вдоль оси колеса. H — высота боковины, от обода к наружному краю: H = B·p÷100. Число после R — диаметр диска в дюймах. Сначала переведи его в миллиметры: d мм = 25,4·d. Полный диаметр D = H + d мм + H. Размеры модели соответствуют маркировке; форма боковин схематична.'],
 'wheel-compare':['Сравни одноимённые размеры двух колёс.', 'Потяни колесо, чтобы повернуть его. Меняй профиль: пунктир сохраняет профиль 60% при тех же ширине и диске. Сравни диаметры, затем радиусы.', 'Сначала найди оба полных диаметра, затем вычти меньший из большего. Разность радиусов вдвое меньше разности диаметров.'],
 lookup:['Выбери нужный столбец и нужную строку.', 'В учебной таблице выбери столбец, затем строку. Нажми клетку на их пересечении.', 'Читай заголовок столбца вместе с единицей измерения. В задачах на соответствие записывай номера в порядке строк или столбцов, указанном в вопросе.'],
 chart:['У каждого графика — своя величина и шкала.', 'Выбери величину и месяц. Затем включи уровень пакета: какие месяцы превысили его?', 'Сначала найди нужную линию по легенде, потом значение на её шкале. «Больше» не включает равенство, «не меньше» включает. Для годовой стоимости нужны все 12 месяцев.'],
 annual:['Сравни расходы за весь год.', 'Меняй число месяцев с большим расходом. Выясни, всегда ли тариф с меньшей абонплатой выгоднее.', 'Посчитай каждый месячный платёж с доплатами, затем сложи все 12. В ответ запиши абонплату выбранного тарифа, если именно её спрашивают.'],
 fuel:['Отдели расходы по шоссе и по просёлку.', 'Меняй неизвестный расход на просёлке. Найди положение, где два маршрута требуют одинаковое количество бензина.', 'Для участка: бензин = расстояние · расход на 100 км ÷ 100. Сложи участки каждого маршрута и приравняй результаты.'],
 payback:['Сравни дополнительную покупку с экономией за час.', 'Меняй экономию за час. Наблюдай, через сколько часов она покроет более дорогую установку.', 'Разница покупки и установки ÷ экономия за час = время окупаемости. Экономию найди как разность стоимости одного часа двух систем.'],
 arch:['Проведи радиусы к концам хорды и высоту к её середине.', 'Меняй половину хорды и стрелку подъёма. Сравни высоту дуги с полным радиусом.', 'Если половина хорды a, стрелка h и радиус R, то R² = a² + (R − h)². Квадраты R сокращаются после раскрытия скобок.']
};
function buildModel(host,kind,options={}){
 if(kind==='wheel'||kind==='wheel-compare'){global.Tire3D.mount(host,{kind});return;}
 const controls=element('div',null,'pd-controls');host.append(controls);const draw=picture(host,'Учебная интерактивная модель: '+kind),read=output(host);
 if(kind==='area'||kind==='length'){
  const a=range(controls,'a','Клеток по длине',1,8,5),b=range(controls,'b','Клеток по ширине',1,5,3),u=range(controls,'u','Сторона клетки, м',.2,2,.5,.1),mode=select(controls,'mode','Что измеряем',[['length','Длину'],['area','Площадь'],['perimeter','Периметр']]);mode.value=kind==='area'?'area':'length';
  watch([a,b,u,mode],()=>{const A=+a.value,B=+b.value,U=+u.value,step=32;let svg='';for(let x=0;x<A;x++)for(let y=0;y<B;y++)svg+=`<rect x="${40+x*step}" y="${25+y*step}" width="32" height="32" fill="${mode.value==='area'?'#d7eadf':'#fff'}" stroke="#719c80"/>`;svg+=line(40,25+B*step,40+A*step,25+B*step,blue,5)+text(40+A*step/2,54+B*step,fmt(A*U)+' м',blue);draw(svg);read(mode.value==='area'?`${A} · ${B} = ${A*B} клеток; площадь клетки ${fmt(U*U)} м²; площадь фигуры ${fmt(A*B*U*U)} м².`:mode.value==='perimeter'?`Периметр: 2 · (${fmt(A*U)} + ${fmt(B*U)}) = ${fmt(2*(A+B)*U)} м.`:`Длина: ${A} · ${fmt(U)} = ${fmt(A*U)} м.`);});
 }else if(kind==='triangle'||kind==='arch'){
  const a=range(controls,'a',kind==='arch'?'Половина хорды, см':'Первый катет, ед.',2,10,6,.5),b=range(controls,'b',kind==='arch'?'Стрелка подъёма, см':'Второй катет, ед.',1,8,4,.5);let measured=false;
  const run=()=>{if(kind==='arch'){b.max=a.value;if(+b.value>+a.value){b.value=a.value;b.parentElement.querySelector('output').textContent=fmt(+b.value);}}const A=+a.value,B=+b.value,c=Math.hypot(A,B);if(kind==='arch'){const r=(A*A+B*B)/(2*B),scale=Math.min(140/(2*r),130/A),cx=180,cy=50+r*scale;const yy=50+B*scale,x=A*scale;draw(`<circle cx="${cx}" cy="${cy}" r="${r*scale}" fill="#f2f7f3" stroke="${green}"/>`+line(cx-x,yy,cx+x,yy,blue)+line(cx,50,cx,yy,amber)+line(cx,yy,cx,cy,blue)+text(cx+12,(50+yy)/2,'h',amber,'start')+`<circle cx="${cx}" cy="${cy}" r="3" fill="${green}"/>`+text(cx-13,cy+10,'O',green)+line(cx,cy,cx+x,yy,green)+(r>B+.001?`<path d="M${cx} ${yy+10}h10v-10" fill="none" stroke="${green}"/>`:'')+text(180,215,'h — оранжевый отрезок; R − h — синий'));read(`Половина хорды ${fmt(A)} см; h = ${fmt(B)} см. ${measured?'R = '+fmt(r)+' см.':'Измерь радиус после изменения модели.'}`);}else{const x=55+A*21,y=185-B*21;draw(`<path d="M55 ${y}V185H${x}Z" fill="#e9f2ed" stroke="${green}" stroke-width="3"/><path d="M55 167H73V185" fill="none" stroke="${green}" stroke-width="2"/>`+text(33,(185+y)/2,fmt(B),blue)+text((55+x)/2,213,fmt(A),blue)+text((55+x)/2+12,(185+y)/2-14,measured?fmt(c):'?',amber));read(measured?`${fmt(A)}² + ${fmt(B)}² = ${fmt(c*c)}; третья сторона ≈ ${fmt(c)} ед.`:'Изменяй катеты, потом измерь третью сторону.');}};
  const measure=button(controls,kind==='arch'?'Измерить радиус':'Измерить третью сторону',()=>{measured=!measured;measure.setAttribute('aria-pressed',String(measured));run();});measure.setAttribute('aria-pressed','false');measure.dataset.pdChoice='measure';watch([a,b],run);
 }else if(kind==='packs'){
  const need=range(controls,'need','Нужно предметов',1,36,13),size=range(controls,'size','Предметов в упаковке',2,12,6);
  watch([need,size],()=>{const N=+need.value,S=+size.value,count=Math.ceil(N/S);let body='';for(let i=0;i<count;i++){const x=12+(i%6)*56,y=15+Math.floor(i/6)*65,used=Math.min(S,N-i*S);body+=`<rect x="${x}" y="${y}" width="46" height="42" fill="#fff" stroke="${green}"/><rect x="${x}" y="${y+42*(1-used/S)}" width="46" height="${42*used/S}" fill="#74af87"/>`+text(x+23,y+60,`${used} шт.`);}draw(body);read(`Нужно ${N}, в упаковке ${S}. Покупаем ${count} упак. Места в последней использованы: ${N-(count-1)*S} из ${S}.`);});
 }else if(kind==='percent'||kind==='inverse-percent'){
  const base=range(controls,'base',kind==='percent'?'Основа сравнения, ед.':'Нынешняя цена, ₽',20,200,80,10),p=range(controls,'p',kind==='percent'?'Новая величина: % от основы':'Изменение, %',kind==='percent'?0:5,kind==='percent'?500:80,kind==='percent'?125:20,5),mode=select(controls,'mode',kind==='percent'?'Вопрос':'Как изменилась цена',kind==='percent'?[['change','На сколько процентов изменилась'],['part','Сколько процентов составляет']]:[['discount','Снизилась'],['growth','Выросла']]);
  watch([base,p,mode],()=>{const B=+base.value,P=+p.value;if(kind==='percent'){const N=B*P/100,w=300/Math.max(100,P);draw(`<rect x="20" y="35" width="${100*w}" height="36" fill="#c5dfcf"/><rect x="20" y="115" width="${P*w}" height="36" fill="${green}"/>`+text(20,25,`Основа: ${fmt(B)} = 100%`,green,'start')+text(20,187,`Новая величина: ${fmt(N)}`,green,'start'));read(mode.value==='part'?`${fmt(N)} составляет ${P}% от ${fmt(B)}.`:`${P===100?'Величина не изменилась':P>100?'Рост':'Снижение'}${P===100?'':': '+Math.abs(P-100)+'%'}. Новая величина составляет ${P}% от основы.`);}else{const k=1+(mode.value==='discount'?-P:P)/100,old=B/k;draw(text(180,45,'Прежняя: '+fmt(old)+' ₽')+text(180,105,(mode.value==='discount'?'−':'+')+P+'%')+text(180,170,'Нынешняя: '+B+' ₽'));read(`Прежняя цена: ${B} ÷ ${fmt(k)} ≈ ${fmt(old)} ₽. Проверка: ${fmt(old)} · ${fmt(k)} ≈ ${B} ₽.`);}});
 }else if(kind==='paper'||kind==='paper-ratio'||kind==='paper-mass'){
  const n=range(controls,'format','Номер формата A',0,6,2),density=kind==='paper-mass'?range(controls,'density','Масса 1 м² бумаги, г',40,160,80,10):null,count=kind==='paper-mass'?range(controls,'count','Листов в пачке',10,500,100,10):null;
  const run=()=>{const N=+n.value,den=2**N,short=2**(-.25)*2**(-N/2),long=Math.SQRT2*short,x=long*170,y=short*170;draw(`<rect x="30" y="25" width="${x}" height="${y}" fill="#d8ebdf" stroke="${green}" stroke-width="3"/>`+text(30+x/2,50+y,'A'+N)+text(180,220,kind==='paper-ratio'?'Длинная : короткая = √2':`Из A0 получилось ${den} листов`));read(kind==='paper-mass'?`Площадь одного листа ${precise(1/den)} м²; его масса ${fmt(+density.value/den)} г. Пачка: ${fmt(+density.value*+count.value/den)} г = ${fmt(+density.value*+count.value/den/1000)} кг.`:kind==='paper-ratio'?'Длинная ÷ короткая ≈ 1,41; короткая ÷ длинная ≈ 0,71. Форматы подобны, значения относятся к идеальной модели.':`${N} разрезов: ${den} листов A${N} из A0; площадь каждого — ${precise(1/den)} м².`);};
  button(controls,'Разрезать пополам',()=>{n.value=Math.min(6,+n.value+1);n.dispatchEvent(new Event('input',{bubbles:true}));});button(controls,'Вернуться к A0',()=>{n.value=0;n.dispatchEvent(new Event('input',{bubbles:true}));});watch([n,density,count].filter(Boolean),run);
 }else if(kind==='volume'||kind==='walls'){
  const a=range(controls,'a','Длина комнаты, м',2,6,4,.5),b=range(controls,'b','Ширина комнаты, м',2,5,3,.5),h=range(controls,'h','Высота, м',2,4,2.5,.5),door=kind==='walls'?range(controls,'door','Площадь двери, м²',0,4,2,.5):null;
  watch([a,b,h,door].filter(Boolean),()=>{const A=+a.value,B=+b.value,H=+h.value;const right=55+A*34,dx=B*13,dy=B*6,top=175-H*28;if(kind==='walls'){const width=2*(A+B)*14,height=H*14,doorWidth=+door.value*7;draw(`<rect x="20" y="${140-height}" width="${width}" height="${height}" fill="#d4e8db" stroke="${green}" stroke-width="3"/><rect x="35" y="112" width="${doorWidth}" height="28" fill="#fff" stroke="${blue}" stroke-width="2"/>`+text(180,50,`Стены развернули: ${fmt(2*(A+B))} м`)+text(180,180,`Высота ${fmt(H)} м; дверь ${fmt(+door.value)} м²`));}else draw(`<path d="M55 175H${right}V${top}H55Z M55 ${top}L${55+dx} ${top-dy}H${right+dx}L${right} ${top} M${right} 175L${right+dx} ${175-dy}V${top-dy}" fill="#e1eee5" stroke="${green}" stroke-width="3"/>`+text((55+right)/2,215,`Длина ${fmt(A)} м`)+text(right+dx/2,195,fmt(B)+' м')+text(30,(175+top)/2,fmt(H)));read(kind==='volume'?`Площадь пола ${fmt(A*B)} м²; объём ${fmt(A*B*H)} м³.`:`Развёртка стен: ${fmt(2*(A+B))} · ${fmt(H)} = ${fmt(2*(A+B)*H)} м². Без двери: ${fmt(2*(A+B)*H-+door.value)} м².`);});
 }else if(kind==='land-map'){
  let stage=0;
  const choices=[];
  const render=()=>{
   draw(`<rect x="15" y="15" width="330" height="190" fill="#f4f8ef" stroke="#94aa91" stroke-width="2"/><rect data-land-region="A" x="35" y="35" width="195" height="150" fill="${stage>0?'#b8ddc3':'#e2efdc'}" stroke="${stage>0?amber:green}" stroke-width="4"/><rect data-land-region="B" x="65" y="65" width="35" height="90" fill="${stage>1?'#97d8d3':'#d9efec'}" stroke="${stage>1?amber:blue}" stroke-width="4"/><rect data-land-region="C" x="265" y="100" width="55" height="70" fill="#eadbc7" stroke="#806b50" stroke-width="3"/>`+text(170,65,'A')+text(82.5,117,'B',blue)+text(292.5,140,'C','#806b50')+text(180,226,'Учебный участок'));
   choices.forEach((b,i)=>b.setAttribute('aria-pressed',String(i<stage)));
  };
  for(const [i,letter]of ['A','B','C'].entries()){
   const b=button(controls,letter,()=>{
    if(stage===0){if(i!==0){read('Огород — большой прямоугольник, внутри которого есть ещё один объект. Посмотри на границы фигур.');return;}stage=1;render();read('Огород найден. Теперь выбери узкую теплицу внутри него.');}
    else if(stage===1){if(i!==1){read('Теплица должна быть внутри огорода. Найди узкий прямоугольник, целиком окружённый его границей.');return;}stage=2;render();read('Связь найдена: огород содержит теплицу. Теперь найди нужные объекты по описанию своего участка.');}
    else read('Огород и теплица найдены. Можно начать заново или вернуться к своей задаче.');
   });b.dataset.pdChoice=String(i+1);b.setAttribute('aria-label','Выбрать область '+letter);b.setAttribute('aria-pressed','false');choices.push(b);
  }
  button(controls,'Начать заново',()=>{stage=0;render();read('Сначала выбери огород: большой прямоугольник с теплицей внутри.');});
  render();read('Сначала выбери огород: большой прямоугольник с теплицей внутри.');
 }else if(kind==='route'||kind==='map'||kind==='journey'||kind==='fuel'){
  const a=kind==='map'?{value:6}:range(controls,'a','Первый участок, км',2,20,6),b=kind==='map'?{value:8}:range(controls,'b','Второй участок, км',2,20,8),v=kind==='journey'?range(controls,'v','Скорость на первом участке, км/ч',10,80,40,5):kind==='fuel'?range(controls,'v','Расход на просёлке, л/100 км',4,20,10,.2):null;let picks=[];
  const run=()=>{const A=+a.value,B=+b.value;let svg=line(55,40,55,170,picks.includes(1)?amber:green,6)+line(55,170,300,170,picks.includes(2)?amber:green,6);svg+='<path d="M55 152H73V170" stroke="'+green+'" fill="none"/>';svg+=(kind==='map'?'':text(28,108,fmt(A))+text(180,205,fmt(B)))+(kind==='fuel'?line(55,40,300,170,blue,3):'')+text(78,42,kind==='map'?'Вход':'A',green,'start')+text(55,225,kind==='map'?'Коридор':'B')+text(300,145,kind==='map'?'Комната':'C');draw(svg);read(kind==='journey'?`Участок 1: ${fmt(A/+v.value*60)} мин. Участок 2 при 30 км/ч: ${fmt(B/30*60)} мин. Всего ${fmt((A/+v.value+B/30)*60)} мин.`:kind==='fuel'?`Маршрут 1: ${fmt((A+B)*8/100)} л (шоссе 8 л/100 км). Маршрут 2: ${fmt(Math.hypot(A,B)*+v.value/100)} л (по прямому просёлку длиной ${fmt(Math.hypot(A,B))} км).`:kind==='map'?picks.length===2&&picks[0]===1&&picks[1]===2?'Путь найден: вход → коридор → комната. В своей задаче проверь те же связи по тексту.':'Сначала выбери путь от входа к коридору, затем от коридора к комнате.':`Выбрано участков: ${picks.length}; их длина ${fmt((picks.includes(1)?A:0)+(picks.includes(2)?B:0))} км.`);};
  for(const [id,label] of [[1,kind==='map'?'Вход → коридор':'Выбрать первый участок'],[2,kind==='map'?'Коридор → комната':'Выбрать второй участок']]){const btn=button(controls,label,()=>{picks=picks.includes(id)?picks.filter(x=>x!==id):[...picks,id];btn.setAttribute('aria-pressed',String(picks.includes(id)));qa('[data-pd-choice]',controls).forEach(b=>b.dataset.pdOrder=String(picks.indexOf(+b.dataset.pdChoice)+1));run();});btn.dataset.pdChoice=String(id);btn.setAttribute('aria-pressed','false');}watch([a,b,v].filter(i=>i&&i.addEventListener),run);
 }else if(kind==='chart'){
  const metric=select(controls,'metric','Какую величину читаем',[['minutes','Минуты'],['gb','Гигабайты']]),month=range(controls,'month','Номер месяца',1,6,1),limit=range(controls,'limit','Уровень на шкале',1,12,6);const minutes=[200,400,300,500,250,450],gb=[4,8,6,10,5,9];
  watch([metric,month,limit],()=>{const data=metric.value==='minutes'?minutes:gb,k=metric.value==='minutes'?.3:15,L=+limit.value*(metric.value==='minutes'?50:1),M=+month.value;limit.parentElement.querySelector('span').textContent='Уровень, '+(metric.value==='minutes'?'мин':'ГБ');limit.parentElement.querySelector('output').textContent=fmt(L);limit.setAttribute('aria-valuetext',fmt(L)+(metric.value==='minutes'?' минут':' гигабайт'));let body=line(45,195,330,195)+line(45,195,45,15);for(let j=0;j<=6;j++){const value=j*(metric.value==='minutes'?100:2),y=195-value*k;body+=line(45,y,330,y,'#d6e1d9',1)+text(38,y+6,value,green,'end');}for(let i=0;i<6;i++){const x=70+i*48,y=195-data[i]*k;if(i)body+=line(x-48,195-data[i-1]*k,x,y,blue,3);body+=`<circle cx="${x}" cy="${y}" r="${i+1===M?8:5}" fill="${i+1===M?amber:blue}"/>`+text(x,219,i+1);}body+=`<line x1="45" y1="${195-L*k}" x2="330" y2="${195-L*k}" stroke="${amber}" stroke-width="2" stroke-dasharray="5 4"/>`;draw(body);read(`Месяц ${M}: ${data[M-1]} ${metric.value==='minutes'?'мин':'ГБ'}. Уровень ${L}. Выше уровня: месяцы ${data.map((x,i)=>x>L?i+1:null).filter(Boolean).join(', ')||'нет'}.`);});
 }else if(kind==='lookup'&&options.page==='tires'){
  const disk=select(controls,'disk','Диаметр диска, дюймы',[['14','14'],['15','15'],['16','16']]),extreme=select(controls,'extreme','Какую ширину ищем',[['min','Наименьшую'],['max','Наибольшую']]);disk.value='15';
  const data=[[175,'65','60','—'],[195,'60','55','50'],[215,'—','50','45']],disks=[14,15,16];
  const table=element('table',null,'pd-table');table.innerHTML='<thead><tr><th>Ширина, мм</th>'+disks.map(d=>'<th>'+d+'″</th>').join('')+'</tr></thead><tbody>'+data.map((r,i)=>'<tr><th>'+r[0]+'</th>'+r.slice(1).map((p,j)=>'<td><button type="button" data-r="'+i+'" data-d="'+disks[j]+'">'+p+'</button></td>').join('')+'</tr>').join('')+'</tbody>';host.querySelector('.pd-picture').replaceWith(table);host.querySelector('[data-pd-choice=zoom]')?.remove();
  const run=()=>{qa('button',table).forEach(b=>b.classList.toggle('pd-target-column',b.dataset.d===disk.value));read('Нажми ячейку нужного столбца. «—» означает, что такую шину ставить нельзя. Ищи '+(extreme.value==='min'?'наименьшую':'наибольшую')+' допустимую ширину.');};
  table.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.d!==disk.value){read('Выбери столбец диска '+disk.value+' дюймов.');return;}if(b.textContent==='—'){read('В этой клетке прочерк: сочетание не допускается.');return;}const col=disks.indexOf(+disk.value)+1,valid=data.filter(r=>r[col]!=='—').map(r=>r[0]),target=extreme.value==='min'?Math.min(...valid):Math.max(...valid),width=data[+b.dataset.r][0];read(width===target?'Подходит: '+width+' мм. В ячейке указан профиль, а ширина находится в начале строки.':'Эта ширина допустима. Посмотри, есть ли ещё '+(extreme.value==='min'?'меньшая':'большая')+' допустимая ширина.');});watch([disk,extreme],run);
 }else if(kind==='lookup'||kind==='compare'||kind==='capacity'){
  const measureLabel=options.page==='stoves'?'Масса, кг':'Ширина, см';
  const rows=kind==='capacity'?[[1,6,15.5],[2,10,19.5],[3,8,18]]:kind==='compare'?[[1,45,18000],[2,55,16000],[3,40,19500]]:[[1,40,19000],[2,55,22500],[3,30,17000]];
  const table=element('table',null,'pd-table');table.innerHTML='<thead><tr><th>№</th><th>'+(kind==='capacity'?'От, м³':kind==='lookup'?measureLabel:'Ширина, см')+'</th><th>'+(kind==='capacity'?'До, м³':'Цена, ₽')+'</th></tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map((x,i)=>'<td><button type="button" data-row="'+r[0]+'" data-col="'+i+'">'+fmt(x)+'</button></td>').join('')+'</tr>').join('')+'</tbody>';host.querySelector('.pd-picture').replaceWith(table);host.querySelector('[data-pd-choice=zoom]')?.remove();
  const chosen=kind==='capacity'?range(controls,'need','Объём комнаты, м³',5,20,15,.5):kind==='compare'?range(controls,'need','Максимальная ширина, см',35,60,50,5):select(controls,'col','Нужный столбец',[['1',measureLabel],['2','Цена, ₽']]);
  const selected=new Set();
  const run=()=>{qa('tbody tr',table).forEach((tr,i)=>{const yes=kind==='capacity'?rows[i][1]<=+chosen.value&&+chosen.value<=rows[i][2]:kind==='compare'?rows[i][1]<=+chosen.value:true;tr.classList.toggle('pd-unsuitable',!yes);if(!yes)selected.delete(rows[i][0]);if(kind==='capacity'){const button=tr.querySelector('button[data-col="0"]');button.dataset.pdChoice='capacity-'+rows[i][0];button.setAttribute('aria-pressed',String(selected.has(rows[i][0])));}});read(kind==='capacity'?'Нажми номер каждой печи, в диапазон которой попадает объём.':kind==='compare'?'Нажми цену подходящего варианта. Сравни только строки без зачёркивания.':'Нажми клетку во второй строке выбранного столбца.');};
  table.addEventListener('click',e=>{const btn=e.target.closest('button');if(!btn)return;const row=rows[+btn.dataset.row-1],col=+btn.dataset.col;if(kind==='capacity'&&col!==0){read('Нажми номер печи в первом столбце.');return;}if(kind==='compare'&&col!==2){read('Нажми цену в последнем столбце.');return;}const ok=kind==='capacity'?row[1]<=+chosen.value&&+chosen.value<=row[2]:kind==='compare'?row[1]<=+chosen.value:row[0]===2&&col===+chosen.value;if(!ok){read('Проверь нужную строку, заголовок столбца и ограничения.');return;}if(kind==='capacity'){selected.has(row[0])?selected.delete(row[0]):selected.add(row[0]);btn.setAttribute('aria-pressed',String(selected.has(row[0])));const total=rows.filter(r=>r[1]<=+chosen.value&&+chosen.value<=r[2]).length;read(`Выбрано подходящих печей: ${selected.size} из ${total}. Границы диапазона тоже подходят.`);}else if(kind==='compare'){const min=Math.min(...rows.filter(r=>r[1]<=+chosen.value).map(r=>r[2]));read(row[2]===min?`Подходит и дешевле остальных подходящих: ${fmt(row[2])} ₽.`:'По ширине подходит. Сравни цену с другими подходящими вариантами.');}else read(`Подходит. Выбрано: ${fmt(row[col])}. Теперь проверь аналогичную строку в своей задаче.`);});watch([chosen],run);
 }else if(kind==='purchase'){
  const n=range(controls,'n','Количество товара, шт.',1,12,3),delivery=range(controls,'delivery','Доставка из магазина A, ₽',0,1500,600,100),install=range(controls,'install','Установка (в обоих магазинах), ₽',0,2000,400,200);
  watch([n,delivery,install],()=>{const N=+n.value,A=N*500+(+delivery.value)+(+install.value),B=N*600+300+(+install.value),max=Math.max(A,B);draw(text(20,25,'A: товар 500 ₽/шт.',green,'start')+`<rect x="20" y="40" width="${300*A/max}" height="40" fill="${green}"/>`+text(20,120,'B: товар 600 ₽/шт.',blue,'start')+`<rect x="20" y="135" width="${300*B/max}" height="40" fill="${blue}"/>`);read(`A: ${N} · 500 + ${delivery.value} + ${install.value} = ${fmt(A)} ₽. B: ${N} · 600 + 300 + ${install.value} = ${fmt(B)} ₽. ${A===B?'Суммы равны.':'Дешевле '+(A<B?'A':'B')+'.'}`);});
 }else if(kind==='annual'||kind==='cost'||kind==='payback'){
  const n=range(controls,'n',kind==='payback'?'Экономия за час, ₽':kind==='annual'?'Месяцев с большим расходом':'Расход за месяц, ед.',kind==='payback'?5:0,kind==='payback'?50:kind==='annual'?12:20,kind==='payback'?20:kind==='annual'?4:8,kind==='payback'?5:1);
  watch([n],()=>{const N=+n.value,A=kind==='payback'?6000:kind==='annual'?12*300+N*200:300+Math.max(0,N-10)*40,B=kind==='payback'?N:kind==='annual'?12*420:420+Math.max(0,N-16)*25,max=Math.max(A,kind==='payback'?6000:B),wa=300*A/max,wb=kind==='payback'?300*Math.min(6000,N*100)/max:300*B/max;draw(text(20,25,kind==='payback'?'Доплата за установку':'Вариант A',green,'start')+`<rect x="20" y="35" width="${wa}" height="38" fill="${green}"/>`+text(20,112,kind==='payback'?'Экономия за 100 часов':'Вариант B',blue,'start')+`<rect x="20" y="125" width="${wb}" height="38" fill="${blue}"/>`);read(kind==='payback'?`Доплата 6000 ₽; экономия ${N} ₽/ч. Окупится через ${fmt(6000/N)} ч.`:kind==='annual'?`За год: A — ${fmt(A)} ₽; B — ${fmt(B)} ₽. ${A===B?'Стоимость одинакова.':'Выгоднее '+(A<B?'A (абонплата 300 ₽)':'B (абонплата 420 ₽)')+'.'}`:`A: 300 ₽ включает 10 ед., затем 40 ₽/ед. Итого ${fmt(A)} ₽. B: 420 ₽ включает 16 ед., затем 25 ₽/ед. Итого ${fmt(B)} ₽.`);});
 }
}
function build(panel,options={}){
 const kind=typeFor(options.page,options.type,options.text),plan=plans[kind];panel.dataset.discoveryModel=kind;
 const first=element('p',plan[0],'pd-first-step');panel.append(first);
 const lab=details('Помочь разобраться на модели?');panel.append(lab);const content=q('.pm-content',lab);
 content.append(element('p',plan[1],'pd-instruction'),element('p',kind==='land-map'?'Это учебный план. Затем вернись к своему заданию.':'Учебная модель на других числах. Ответ к своей задаче запиши в её поле ответа.','pd-note'));
 buildModel(content,kind,options);
 const further=details('Почему так?');q('.pm-content',further).append(element('p',plan[2]));content.append(further);
 if(options.steps?.length){const next=details('Как применить к моей задаче?');const box=q('.pm-content',next);options.steps.forEach(s=>{const step=element('div',null,'pm-model-step');step.innerHTML=s;box.append(step);});panel.append(next);}
 const close=button(panel,'Вернуться к задаче',()=>{options.close?.();});close.classList.add('pd-return');
 return {kind,lab};
}
function attach(host,page,type,textValue,nativeButton,nativePanel){
 if(!host||host.dataset.pdAttached==='1')return;
 host.dataset.pdAttached='1';const key=page+'|'+type+'|'+String(textValue||host.textContent),saved=memory.get(key);
 const wrap=element('div',null,'pm-context-hint pd-native-help'),toggle=element('button','Хочешь подсказку?','pm-hint-button pd-toggle');toggle.type='button';
 const panel=element('section',null,'pm-model pd-panel');panel.id='pd-panel-'+(++serial);panel.hidden=!saved?.open;panel.setAttribute('aria-label','Помощь к текущей задаче');toggle.setAttribute('aria-controls',panel.id);toggle.setAttribute('aria-expanded',String(!panel.hidden));
 const save=()=>{memory.set(key,{open:!panel.hidden,details:qa('details',panel).map(d=>d.open),values:qa('[data-pd-key]',panel).map(i=>[i.dataset.pdKey,i.value]),choices:qa('[data-pd-choice]',panel).filter(b=>b.getAttribute('aria-pressed')==='true').sort((a,b)=>(+a.dataset.pdOrder||0)-(+b.dataset.pdOrder||0)).map(b=>b.dataset.pdChoice)});if(memory.size>100)memory.delete(memory.keys().next().value);};
 const syncToggle=()=>{toggle.setAttribute('aria-expanded',String(!panel.hidden));if(page==='tires')toggle.textContent=panel.hidden?'Хочешь подсказку?':'Убрать подсказку';};
 const close=()=>{panel.hidden=true;syncToggle();save();toggle.focus();};
 build(panel,{page,type,text:textValue,close});syncToggle();toggle.addEventListener('click',()=>{panel.hidden=!panel.hidden;syncToggle();save();});wrap.append(toggle,panel);host.after(wrap);
 if(nativeButton&&nativePanel){const exact=details('Нужна подсказка с числами из условия?');exact.classList.add('pd-native-detail');const content=q('.pm-content',exact);nativeButton.dataset.pdSecondary='1';nativeButton.textContent='Показать подсказку к этой задаче';content.append(nativeButton,nativePanel);panel.insertBefore(exact,q('.pd-return',panel));nativeButton.addEventListener('click',save,true);}
 if(saved){qa('details',panel).forEach((d,i)=>d.open=!!saved.details[i]);for(const [k,v] of saved.values||[]){const input=qa('[data-pd-key]',panel).find(e=>e.dataset.pdKey===k);if(input){input.value=v;input.dispatchEvent(new Event('input',{bubbles:true}));}}for(const k of saved.choices||[]){qa('[data-pd-choice]',panel).find(e=>e.dataset.pdChoice===k)?.click();}}
 panel.addEventListener('input',save);panel.addEventListener('change',save);panel.addEventListener('toggle',save,true);panel.addEventListener('click',()=>queueMicrotask(save));
 return panel;
}
function decorate(page){
 if(!['roads-grid','stoves','apartments','paper-sheets','tires'].includes(page))return;
 if(page==='tires'){
  qa('.step-section .card-intro').forEach(host=>attach(host,page,host.closest('.step-section').id,host.textContent));
  const finals=['t1-final','t2-H','t3-D','t4-diff','t5-final'];
  const labels=['Запиши ширину шины в миллиметрах.','Запиши высоту боковины в миллиметрах.','Запиши полный диаметр колеса в миллиметрах.','Запиши разность размеров, которую спрашивают в условии, в миллиметрах.','Запиши изменение пробега в процентах. Округли до десятых.'];
  finals.forEach((id,i)=>{
   const final=q('#'+id),section=q('#section-'+(i+2)),intro=section&&q('.card-intro',section),panel=intro?.nextElementSibling?.querySelector('.pd-panel');
   if(!final||!panel||final.dataset.pdMain==='1')return;
   final.dataset.pdMain='1';final.classList.remove('locked');
   const title=q('.substep-label',final),prompt=q('.substep-q',final);if(title)title.textContent='Твой ответ';if(prompt)prompt.textContent=labels[i];
   intro.after(final);
   const steps=details('Помочь решить по шагам?');steps.classList.add('pd-original-steps');const content=q('.pm-content',steps);
   const body=q('.task-body',section);if(body)content.append(body);
   qa('.substep',section).filter(node=>node!==final&&!node.closest('.pd-original-steps')&&!node.closest('.pd-panel')).forEach(node=>content.append(node));
   const animation=q('.anim-block',section);if(animation)content.prepend(animation);
   const nativeButton=q('.substep-hint-btn',final),nativePanel=q('.substep-hint',final);
   if(nativeButton&&nativePanel){const exact=details('Подсказка к итоговому ответу');q('.pm-content',exact).classList.add('substep');q('.pm-content',exact).append(nativeButton,nativePanel);content.append(exact);}
   panel.insertBefore(steps,q('.pd-return',panel));
   qa('.compat-table .win,.compat-table .col-hl',section).forEach(cell=>cell.classList.remove('win','col-hl'));
  });
  qa('#section-0 .quiz-q,#section-1 .substep-q').forEach(host=>{const sub=host.closest('.substep'),b=sub&&q('.substep-hint-btn',sub),p=sub&&q('.substep-hint',sub);attach(host,page,sub?.id||host.parentElement.id,host.textContent,b,p);});
  // A side view is useful for radial dimensions, but must never suggest that B
  // is a radial ring thickness. Keep the original task engine and its SVG intact.
  qa('#author-wheel,#cross-svg').forEach(svg=>{if(svg.dataset.tireSideNote)return;svg.dataset.tireSideNote='1';const note=element('p','Это вид со стороны диска: ширина B здесь не видна. Поверни 3D-модель, чтобы увидеть ширину.','pd-note t3d-original-note');svg.parentElement.after(note);});
  const widthLegend=q('.dim-legend .dl-key.b')?.nextElementSibling;
  if(widthLegend){const before=widthLegend.innerHTML,after=before.replace('На схеме — ширина внизу.','Ширина идёт вдоль оси, между самыми выпуклыми частями боковин.').replace('Ширина измеряется поперёк шины.','Ширина идёт вдоль оси, между самыми выпуклыми частями боковин.');if(before!==after)widthLegend.innerHTML=after;}
  return;
 }
 const selectors=page==='apartments'?['#bHint','#hint','#taskBody .question,#taskBody .q,#taskBody p','#taskLbl']:page==='paper-sheets'?['#hintBtn','#hintBox','#taskCard .task-q','#taskCard .task-meta']:['#hint-btn','#hint-box','#task-card .task-question','#task-card .task-meta'];
 const [buttonSelector,panelSelector,questionSelector,metaSelector]=selectors,host=q(questionSelector),nativeButton=q(buttonSelector),nativePanel=q(panelSelector);if(!host||!nativeButton||!nativePanel)return;
 const type=q(metaSelector)?.textContent||'';
 const created=attach(host,page,type,host.textContent,nativeButton,nativePanel);
 if(page==='apartments'){
  const plan=q('#plan'),panel=host.nextElementSibling?.querySelector('.pd-panel');
  if(created&&plan)plan.classList.remove('pd-show-derived');
  qa('#plan text').filter(t=>/кл\s*·.*м²/.test(t.textContent)).forEach(t=>{t.classList.add('pd-derived');const bg=t.previousElementSibling;if(bg?.tagName.toLowerCase()==='rect')bg.classList.add('pd-derived');});
  if(panel&&created){const extra=details('Помочь с подсчётом на плане?'),content=q('.pm-content',extra);qa('#taskBody>.note:not(.warn)').forEach(note=>content.append(note));const show=button(content,'Показать подсчитанные площади',()=>{const visible=show.getAttribute('aria-pressed')!=='true';show.setAttribute('aria-pressed',String(visible));plan?.classList.toggle('pd-show-derived',visible);show.textContent=visible?'Скрыть подсчитанные площади':'Показать подсчитанные площади';});show.setAttribute('aria-pressed','false');content.append(element('p','Подписи появятся на основном плане квартиры. Они не заполняют поле ответа.','pd-note'));panel.insertBefore(extra,q('.pd-return',panel));}
 }

 // Explanations that already contain arithmetic stay behind explicit help.
 if(page==='stoves'){const panel=host.nextElementSibling?.querySelector('.pd-panel');const note=q('#task-card>.note');if(note&&panel&&!/Окон нет/.test(note.textContent)){const d=details('Ещё одна подсказка');q('.pm-content',d).append(note);panel.insertBefore(d,q('.pd-return',panel));}}
}
global.PracticalDiscovery={typeFor,plans,build,decorate,attach};
})(window);
