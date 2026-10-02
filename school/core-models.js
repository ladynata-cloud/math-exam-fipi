(function(root){
'use strict';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=(x,y,s)=>`<text x="${x}" y="${y}" text-anchor="middle" fill="#193d3a" font-size="14">${esc(s)}</text>`;
const line=(x1,y1,x2,y2,color='#387b70',width=3)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}"/>`;
const dot=(x,y,open=false,color='#c66b34')=>`<circle cx="${x}" cy="${y}" r="6" fill="${open?'white':color}" stroke="${color}" stroke-width="3"/>`;
function numberline(lo,hi,marks,segment){const X=x=>45+(x-lo)*470/(hi-lo);let s=line(30,130,530,130,'#829691',1);for(let x=lo;x<=hi;x++)s+=line(X(x),124,X(x),136,'#829691',1)+text(X(x),158,x);if(segment)s+=line(X(segment[0]),130,X(segment[1]),130,'#387b70',7);for(const m of marks)s+=dot(X(m.x),130,m.open)+text(X(m.x),98,m.label);return s;}
function graph(fn,p={}){const xmin=p.xmin??-5,xmax=p.xmax??5,ymin=p.ymin??-5,ymax=p.ymax??10,X=x=>50+(x-xmin)*460/(xmax-xmin),Y=y=>235-(y-ymin)*205/(ymax-ymin);let s='';for(let x=Math.ceil(xmin);x<=xmax;x++)s+=line(X(x),30,X(x),235,'#e3ece8',1)+text(X(x),254,x);for(let y=Math.ceil(ymin);y<=ymax;y+=p.ystep||5)s+=line(50,Y(y),510,Y(y),'#e3ece8',1)+text(30,Y(y)+4,y);if(xmin<=0&&xmax>=0)s+=line(X(0),30,X(0),235,'#829691',1);if(ymin<=0&&ymax>=0)s+=line(50,Y(0),510,Y(0),'#829691',1);let path='',drawing=false;for(let i=0;i<=300;i++){const x=xmin+(xmax-xmin)*i/300,y=fn(x);if(!Number.isFinite(y)||y<ymin||y>ymax){drawing=false;continue;}path+=(drawing?'L':'M')+X(x).toFixed(2)+','+Y(y).toFixed(2);drawing=true;}s+=`<path d="${path}" fill="none" stroke="#387b70" stroke-width="3"/>`;if(p.point){const [x,y]=p.point;if(y>=ymin&&y<=ymax)s+=dot(X(x),Y(y),p.open);}if(p.extra)s+=p.extra(X,Y);return s+text(524,Y(Math.max(ymin,Math.min(ymax,0)))-8,'x')+text(X(Math.max(xmin,Math.min(xmax,0)))+14,18,'y');}
function config(family){
 if(['parabola','derivative','absolute','interval','sign','hole','inverse'].includes(family))return {min:-4,max:4,step:1,initial:1,label:family==='parabola'?'Горизонтальный сдвиг h':family==='derivative'?'Точка касания x':family==='absolute'?'Координата точки':family==='interval'||family==='sign'?'Проверяемое число x':'Значение x'};
 if(family==='circle')return {min:0,max:360,step:30,initial:60,label:'Угол, градусы'};
 if(family==='log')return {min:1,max:4,step:1,initial:2,label:'Аргумент x = 2 в выбранной степени'};
 if(family==='exponential')return {min:-3,max:3,step:1,initial:1,label:'Показатель x'};
 return {min:1,max:6,step:1,initial:2,label:family==='work'?'Количество огородов':family==='mixture'?'Масса второй смеси, порций по 100 г':family==='sine'?'Частота':family==='integral'?'Время, с':family==='root'?'Сторона малого квадрата':family==='statistics'?'Общий сдвиг данных':family==='tree'?'Число вариантов первого выбора':'Параметр опыта'};
}
function investigate(id,family,p,M){let svg='',caption='',question='',target;
 if(family==='balance'){
  const lhs=2*p+3;svg=line(110,200,450,200)+line(280,100,280,200)+line(110,100,450,100)+text(150,74,`2 · ${p} + 3`)+text(410,74,lhs)+text(280,236,'Одинаковое действие с обеими частями');caption=`Равенство 2x + 3 = ${lhs}. Сначала вычтем 3 с обеих сторон. Ни один член не «прыгает» сам по себе.`;question='Чему равна правая часть после вычитания 3?';target=2*p;
 }else if(family==='area'){
  const w=24*p,ox=90,oy=30;svg=`<rect x="${ox}" y="${oy}" width="${w}" height="${w}" fill="#8ecfbc"/><rect x="${ox+w}" y="${oy}" width="48" height="${w}" fill="#f0bd8c"/><rect x="${ox}" y="${oy+w}" width="${w}" height="48" fill="#f0bd8c"/><rect x="${ox+w}" y="${oy+w}" width="48" height="48" fill="#cd875f"/>`+text(360,80,`Сторона ${p} + 2`)+text(360,116,`${p}² + 2·${p} + 2·${p} + 4`);caption='Квадрат собирается из четырёх частей. Скобки — описание одной и той же площади до и после сборки.';question='Площадь всего квадрата?';target=(p+2)**2;
  if(id==='cubes'){svg=text(280,70,`${p}³ − 1³`)+text(280,125,`(${p} − 1)(${p}² + ${p} + 1)`)+text(280,190,'Раскрой скобки: средние члены сокращаются');caption='Числовая лаборатория разности кубов. Здесь две записи одного выражения; равенство доказывается раскрытием скобок.';question='Вычисли разность кубов по любой записи.';target=p**3-1;}
 }else if(family==='work'){
  for(let i=0;i<p;i++)svg+=`<rect x="${35+i*80}" y="45" width="65" height="95" rx="6" fill="#b3d8a5"/>`+text(67+i*80,172,'огород');svg+=text(280,220,'Первый: 1/6 огорода/ч · Второй: 1/3 огорода/ч');caption='Одинаковые огороды. Вместе работники выполняют 1/2 огорода в час. Можно увеличить объём работы, сохранив темп.';question='Сколько часов нужно на все показанные огороды?';target=2*p;
 }else if(family==='mixture'){
  const red=1+3*p,total=10+10*p;svg=`<rect x="95" y="35" width="130" height="170" fill="#f8e3ce"/><rect x="95" y="${205-170*red/total}" width="130" height="${170*red/total}" fill="#d48658"/>`+text(350,80,'100 г с 10% вещества')+text(350,115,`+ ${p*100} г с 30% вещества`)+text(350,170,`Всего ${100*(p+1)} г`);caption='Высота закрашенной части показывает долю вещества в смеси. Доли исходных смесей взвешиваются по их массам.';question='Какова итоговая концентрация в процентах?';target=M.q(10+30*p,1+p);
 }else if(family==='fraction'){
  for(let i=0;i<p+1;i++)svg+=`<rect x="${45+i*460/(p+1)}" y="65" width="${460/(p+1)-2}" height="70" fill="${i<2?'#8ecfbc':'#e4eee8'}"/>`;svg+=text(280,180,`Одно целое, ${p+1} равных частей`);caption='Размер доли задаётся знаменателем, количество выбранных долей — числителем. Сокращение переименовывает одну величину.';question='Какая часть целого закрашена?';target=M.q(2,p+1);
 }else if(family==='hole'){
  svg=graph(x=>x===2?NaN:x+2,{point:[2,4],open:true})+text(345,65,`Проверяем x = ${p}`);caption='График (x² − 4)/(x − 2) совпадает с y = x + 2, кроме выколотой точки x = 2. Сокращение не заполняет дырку.';question='Определена исходная дробь при выбранном x? Ответ «да» или «нет».';target=p===2?'нет':'да';
 }else if(family==='root'){
  for(let row=0;row<p;row++)for(let col=0;col<p;col++)svg+=`<rect x="${110+col*25}" y="${35+row*25}" width="23" height="23" fill="#8ecfbc"/>`;svg+=text(365,85,`Площадь ${p*p}`)+text(365,135,`√${p*p} = сторона`);caption='Квадратный корень связывает площадь квадрата и его неотрицательную сторону. Противоположное число тоже даёт тот же квадрат, но не является арифметическим корнем.';question='Какова длина стороны?';target=p;
 }else if(family==='parabola'){
  svg=graph(x=>(x-p)**2-1,{point:[p,-1]});caption=`y = (x − (${p}))² − 1. Скобка обнуляется при x = ${p}; вершина движется горизонтально, её высота остаётся −1.`;question='Чему равно значение функции при x = 0?';target=p*p-1;
 }else if(family==='interval'||family==='sign'){
  svg=numberline(-5,5,[{x:-2,label:'−2',open:false},{x:3,label:'3',open:family==='sign'}],[-2,3])+dot(45+(p+5)*47,190)+text(280,220,`Проверяем x = ${p}`);caption=family==='sign'?'Рассматриваем (x + 2)/(x − 3) ≤ 0. Числитель обращается в нуль при −2; знаменатель при 3. Точка 3 всегда исключена.':'Рассматриваем систему x ≥ −2 и x ≤ 3. Подходят числа из пересечения двух ограничений.';question='Подходит выбранное число? Ответ «да» или «нет».';target=p>=-2&&(family==='sign'?p<3:p<=3)?'да':'нет';
 }else if(family==='absolute'){
  svg=numberline(-5,5,[{x:1,label:'центр 1'},{x:p,label:'точка'}],[Math.min(1,p),Math.max(1,p)]);caption='Расстояние от точки x до 1 равно |x − 1|. Длина одинакова слева и справа на одинаковом удалении.';question='Каково расстояние между выбранной точкой и 1?';target=Math.abs(p-1);
 }else if(family==='inverse'){
  svg=graph(x=>x===0?NaN:4/x,{point:p===0?null:[p,4/p]});caption='Гипербола y = 4/x. Произведение координат равно 4. При x = 0 функция не определена.';question='При выбранном x введи y точной дробью; при x = 0 введи «нет».';target=p===0?'нет':M.q(4,p);
 }else if(family==='sequence'){
  for(let i=0;i<=p;i++){const h=2**i*2;svg+=`<rect x="${45+i*65}" y="${205-h}" width="35" height="${h}" fill="#8ecfbc"/>`+text(62+i*65,230,i);}caption='Число клеток удваивается каждый час. В нулевой момент одна клетка; подписи под столбцами — прошедшие часы.';question='Сколько клеток через выбранное число часов?';target=2**p;
 }else if(family==='exponential'){
  svg=graph(x=>2**x,{ymin:0,ymax:10,point:[p,2**p]});caption='График y = 2^x остаётся над осью при любом x. Шаг вправо удваивает значение, шаг влево делит на 2.';question='Найди значение функции в отмеченной точке. Можно дробью.';target=p>=0?2**p:M.q(1,2**(-p));
 }else if(family==='log'){
  const x=2**p;svg=graph(v=>v>0?Math.log2(v):NaN,{xmin:0,xmax:16,ymin:-2,ymax:5,ystep:1,point:[x,p]});caption=`y = log₂x. Аргумент ${x} получается ${p} удвоениями единицы. График начинается только при положительных x.`;question=`Чему равен log₂${x}?`;target=p;
 }else if(family==='circle'){
  const t=p*Math.PI/180,cx=280,cy=135,r=100,px=cx+r*Math.cos(t),py=cy-r*Math.sin(t);svg=line(150,cy,410,cy,'#829691',1)+line(cx,15,cx,255,'#829691',1)+`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#387b70" stroke-width="2"/>`+line(cx,cy,px,py)+line(px,py,px,cy,'#c66b34',2)+dot(px,py)+text(460,65,`${p}°`)+text(440,110,'x = cos t')+text(440,140,'y = sin t');caption='Оранжевый отрезок показывает вертикальную координату. Полный оборот возвращает точку, но увеличивает угол на 360°.';question='Каков знак sin выбранного угла? Введи «плюс», «минус» или «ноль».';target=p%180===0?'ноль':p<180?'плюс':'минус';
 }else if(family==='sine'){
  svg=graph(x=>2*Math.sin(p*x),{xmin:0,xmax:2*Math.PI,ymin:-3,ymax:3,ystep:1});caption=`y = 2 sin(${p}x). Вертикальная амплитуда постоянна. На промежутке от 0 до 2π помещается ${p} полных колебаний.`;question='Чему равен коэффициент k в периоде T = kπ?';target=M.q(2,p);
 }else if(family==='derivative'){
  svg=graph(x=>x*x,{ymax:16,point:[p,p*p],extra:(X,Y)=>line(X(Math.max(-5,p-1)),Y(p*p+2*p*(Math.max(-5,p-1)-p)),X(Math.min(5,p+1)),Y(p*p+2*p*(Math.min(5,p+1)-p)),'#c66b34')});caption=`Для y = x² наклон касательной в x = ${p} равен 2x. Высота точки и наклон — разные величины.`;question='Каково значение производной в отмеченной точке?';target=2*p;
 }else if(family==='integral'){
  svg=graph(t=>2*t+1,{xmin:0,xmax:6,ymin:0,ymax:14,ystep:2,extra:(X,Y)=>`<polygon points="${X(0)},${Y(0)} ${X(0)},${Y(1)} ${X(p)},${Y(2*p+1)} ${X(p)},${Y(0)}" fill="#d99a64" opacity=".3"/>`});caption='Скорость v = 2t + 1 положительна. Путь от 0 до выбранного времени равен площади закрашенной трапеции.';question='Каков пройденный путь?';target=p*p+p;
 }else if(family==='tree'){
  for(let i=0;i<p;i++){const xx=45+i*85;svg+=line(280,35,xx+20,115,'#829691',1)+dot(xx+20,115)+line(xx+20,115,xx,195,'#829691',1)+line(xx+20,115,xx+40,195,'#829691',1)+dot(xx,195)+dot(xx+40,195);}caption=`На первом шаге ${p} вариантов, на втором у каждого ровно 2 продолжения. Каждый конечный узел — отдельная пара.`;question='Сколько конечных вариантов?';target=p*2;
 }else if(family==='frequency'){
  for(let i=0;i<10;i++)svg+=`<rect x="${35+i*49}" y="65" width="42" height="80" fill="${i<p?'#d99a64':'#dce9e2'}"/>`;caption='Десять наблюдений. Выделенные клетки обозначают наблюдавшиеся успехи; это описание данных, а не гарантия следующего исхода.';question='Относительная частота успеха?';target=M.q(p,10);
 }else if(family==='venn'){
  svg=`<circle cx="225" cy="135" r="80" fill="#8ecfbc" opacity=".6"/><circle cx="335" cy="135" r="80" fill="#e3a36e" opacity=".6"/>`+text(192,130,8-p)+text(280,130,p)+text(366,130,7-p)+text(280,245,'20 равновозможных исходов');caption=`У A всего 8 исходов, у B всего 7, пересечение содержит ${p}. Числа вне пересечения показывают только одну из областей.`;question='Вероятность A или B?';target=M.q(15-p,20);
 }else{
  const values=[p,p+2,p+4];for(let i=0;i<3;i++)svg+=`<rect x="${130+i*105}" y="${220-values[i]*18}" width="55" height="${values[i]*18}" fill="#8ecfbc"/>`+text(157+i*105,244,values[i]);svg+=line(90,220-(p+2)*18,455,220-(p+2)*18,'#c66b34',2);caption=`Данные ${values.join(', ')}. Общий сдвиг меняет среднее, но отклонения −2, 0, 2 остаются прежними. Шкала столбиков начинается с нуля.`;question='Какова дисперсия трёх показанных значений (деление на 3)?';target=M.q(8,3);
 }
 return {svg,caption,question,target};
}
function install(Models,M,Content){let mountCount=0;const old=Models.mount;Models.mount=(el,model)=>{
 if(!model||model.kind!=='school-core')return old(el,model);
 const row=Content.rows.find(r=>r[0]===model.id),family=row[4],c=config(family);let p=c.initial;
 el.innerHTML='<section class="core-experiment"><p class="eyebrow">Исследуй закономерность</p><h2>Предскажи → измени → объясни</h2><p class="tiny">Это отдельный опыт по теме. Его ответы не засчитываются как самостоятельная проверка.</p><label class="label" for="core-slider">'+esc(c.label)+'</label><div class="core-controls"><button type="button" data-shift="-1" aria-label="Уменьшить параметр">−</button><input id="core-slider" type="range" min="'+c.min+'" max="'+c.max+'" step="'+c.step+'" value="'+p+'"><button type="button" data-shift="1" aria-label="Увеличить параметр">+</button><output for="core-slider"></output></div><div class="core-picture"></div><p class="core-caption"></p><form class="core-prediction"><label class="label" for="core-prediction"></label><div class="answer-line"><input id="core-prediction" autocomplete="off"><button>Проверить предположение</button></div><p role="status"></p></form></section>';
 const suffix='-'+(++mountCount);el.querySelectorAll('[id]').forEach(n=>n.id+=suffix);el.querySelectorAll('[for]').forEach(n=>n.setAttribute('for',n.getAttribute('for')+suffix));
 const input=el.querySelector('input[type=range]'),form=el.querySelector('form');let result;
 function draw(){result=investigate(model.id,family,p,M);el.querySelector('output').textContent=p;el.querySelector('.core-picture').innerHTML='<svg viewBox="0 0 560 275" role="img" aria-label="'+esc(result.caption)+'">'+result.svg+'</svg>';el.querySelector('.core-caption').textContent=result.caption;form.querySelector('label').textContent=result.question;form.querySelector('[role=status]').textContent='';el.querySelector('[data-shift="-1"]').disabled=p<=c.min;el.querySelector('[data-shift="1"]').disabled=p>=c.max;}
 input.oninput=()=>{p=Number(input.value);draw();};el.querySelectorAll('[data-shift]').forEach(b=>b.onclick=()=>{p=Math.max(c.min,Math.min(c.max,p+Number(b.dataset.shift)*c.step));input.value=p;draw();});form.onsubmit=e=>{e.preventDefault();form.querySelector('[role=status]').textContent=M.equal(form.querySelector('input').value,result.target)?'Верно. Объясни, что изменилось и что осталось прежним.':'Проверь модель и условие. Попробуй соседнее значение параметра, затем вернись.';};draw();
 };}
const API={install,investigate,config};if(typeof module!=='undefined'&&module.exports)module.exports=API;else install(root.WorkshopModels,root.WorkshopMath,root.WorkshopCoreContent);
})(typeof window!=='undefined'?window:globalThis);
