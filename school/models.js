(function(root){
 'use strict';
 var esc=function(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
 function svg(body,label,height){return '<svg viewBox="0 0 560 '+(height||290)+'"'+(height?' style="max-height:none"':'')+' role="img" aria-label="'+esc(label)+'">'+body+'</svg>';}
 function txt(x,y,s,anchor){return '<text x="'+x+'" y="'+y+'" text-anchor="'+(anchor||'middle')+'">'+esc(s)+'</text>';}
 function line(x,y,X,Y,cl){return '<line x1="'+x+'" y1="'+y+'" x2="'+X+'" y2="'+Y+'" class="'+(cl||'stroke')+'"/>';}
 function controls(params){return '<div class="model-controls">'+params.map(function(p){return '<label>'+esc(p[1])+' <input type="range" data-param="'+p[0]+'" min="'+p[2]+'" max="'+p[3]+'" step="'+(p[5]||1)+'" value="'+p[4]+'"><output>'+p[4]+'</output></label>';}).join('')+'</div>';}
 function mount(el,original){
  var p=Object.assign({},original),angle=35,selected={x:0,y:0},drag=false;
  function draw(keep){
   var body='',form='',caption='',k=p.kind||'flow',i,j,a=Number(p.a)||1,b=Number(p.b)||1,svgHeight;
   if(k==='fraction'){
    var d=p.d,n=p.n,rows=Math.max(1,Math.ceil(n/d)),cell=440/d,h=34;svgHeight=Math.max(290,45+rows*h+50);
    for(i=0;i<Math.max(d,rows*d);i++)body+='<rect data-cell="'+i+'" x="'+(60+i%d*cell)+'" y="'+(45+Math.floor(i/d)*h)+'" width="'+(cell-3)+'" height="'+(h-3)+'" rx="3" class="'+(i<n?'fill':'empty')+'"/>';
    body+=txt(280,svgHeight-25,n+'/'+d+' = '+root.WorkshopMath.fmt(root.WorkshopMath.q(n,d)));
    form=controls([['n','Число взятых долей',0,Math.max(n,d*4),n],['d','Число равных частей',2,12,d]]);
    caption='Нажимай на части или двигай ползунки. Знаменатель задаёт размер доли, числитель — количество взятых долей. Целые полоски имеют один размер.';
   }else if(k==='area'||k==='array'){
    var cell=Math.min(420/Math.max(1,a),170/Math.max(1,b),38);
    for(i=0;i<Math.min(a,100);i++)for(j=0;j<Math.min(b,20);j++)body+='<rect x="'+(60+i*cell)+'" y="'+(35+j*cell)+'" width="'+Math.max(.5,cell-1)+'" height="'+Math.max(.5,cell-1)+'" class="soft-fill"/>';
    body+=txt(280,230,a+' × '+b+' = '+a*b);
    if(k==='area')body+=txt(280,263,'Граница: '+2*(a+b)+' · Площадь: '+a*b);
    form=controls([['a',k==='area'?'Длина':'В ряду',1,Math.max(12,a),a],['b',k==='area'?'Ширина':'Число рядов',1,Math.max(12,b),b]]);
    caption=k==='area'?'Сравни площадь и периметр. Попробуй найти два прямоугольника с одинаковым периметром и разной площадью.':'Каждый ряд содержит одинаковое количество клеток. Меняй число рядов и длину ряда.';
    if(p.remainder)caption+=' В исходной задаче ещё '+p.remainder+' предметов находятся вне полных групп.';
   }else if(k==='line'){
    var A=Number(p.a)||0,B=Number(p.b)||0,lo=Math.min(0,A,A+B)-2,hi=Math.max(0,A,A+B)+2,toX=function(n){return 45+(n-lo)/(hi-lo)*470;};
    body=line(40,145,525,145);
    var step=Math.max(1,Math.ceil((hi-lo)/12));
    for(i=Math.ceil(lo/step)*step;i<=hi;i+=step)body+=line(toX(i),137,toX(i),153)+txt(toX(i),180,i);
    body+='<circle cx="'+toX(A)+'" cy="145" r="7" class="warm-fill"/><circle cx="'+toX(A+B)+'" cy="145" r="7" class="fill"/>'+line(toX(A),110,toX(A+B),110,'accent-stroke')+txt(toX(A),85,A)+txt(toX(A+B),218,A+B)+txt(280,260,A+' '+(B>=0?'+':'−')+' '+Math.abs(B)+' = '+(A+B));
    form=controls([['a','Начальная точка',Math.min(-20,A),Math.max(20,A),A],['b','Изменение',Math.min(-20,B),Math.max(20,B),B]]);
    caption='Меняй начальную точку и изменение. Положительное изменение ведёт вправо, отрицательное — влево. В вопросах о шкале читай подписи и промежутки.';
   }else if(k==='angle'){
    var deg=p.angle||90,cx=125,cy=215,r=160,rad=deg*Math.PI/180,pts=[];
    for(i=0;i<=deg;i+=2)pts.push((cx+55*Math.cos(i*Math.PI/180))+','+(cy-55*Math.sin(i*Math.PI/180)));
    body=line(cx,cy,cx+r,cy)+line(cx,cy,cx+r*Math.cos(rad),cy-r*Math.sin(rad));
    for(i=0;i<=180;i+=10){var t=i*Math.PI/180;body+=line(cx+122*Math.cos(t),cy-122*Math.sin(t),cx+132*Math.cos(t),cy-132*Math.sin(t));if(i%30===0)body+=txt(cx+151*Math.cos(t),cy-151*Math.sin(t)+5,i);}
    body+='<polyline points="'+pts.join(' ')+'" class="accent-stroke" fill="none"/>'+txt(425,135,deg+'°')+txt(425,172,deg===90?'Прямой':deg===180?'Развёрнутый':deg<90?'Острый':'Тупой');
    form=controls([['angle','Повернуть сторону',1,180,deg]]);
    caption='Построй нужный угол ползунком или стрелками клавиатуры. Начало отсчёта — горизонтальная сторона вправо; длина сторон не влияет на градусы.';
   }else if(k==='coordinate'){
    var map=function(v){return 280+v*34;},Y=function(v){return 145-v*26;};
    for(i=-6;i<=6;i++)body+=line(map(i),15,map(i),275,'grid-stroke')+txt(map(i),164,i);
    for(i=-5;i<=5;i++)body+=line(76,Y(i),484,Y(i),'grid-stroke');
    body+=line(76,145,490,145)+line(280,15,280,275)+txt(501,138,'x')+txt(295,20,'y');
    if(p.reflect)body+='<circle cx="'+map(p.x)+'" cy="'+Y(p.y)+'" r="7" class="warm-fill"/>'+txt(map(p.x)+20,Y(p.y)-12,'A');
    body+='<circle cx="'+map(selected.x)+'" cy="'+Y(selected.y)+'" r="8" class="fill"/>'+txt(map(selected.x),Y(selected.y)-15,'('+selected.x+'; '+selected.y+')');
    form=controls([['x','Горизонталь x',-5,5,selected.x],['y','Вертикаль y',-4,4,selected.y]]);
    caption='Поставь точку нажатием на сетку или ползунками. Сначала читаем x, затем y.'+(p.reflect?' Оранжевая точка — исходная; построй её отражение относительно вертикальной оси.':'');
   }else if(k==='solid'){
    var c=Number(p.c)||3,verts=[[0,0,0],[a,0,0],[a,b,0],[0,b,0],[0,0,c],[a,0,c],[a,b,c],[0,b,c]];
    var rot=angle*Math.PI/180,scale=150/Math.max(a,b,c),project=function(v){var x=v[0]-a/2,y=v[1]-b/2;return [280+scale*(x*Math.cos(rot)-y*Math.sin(rot)),160+scale*.45*(x*Math.sin(rot)+y*Math.cos(rot))-scale*(v[2]-c/2)*.8];};
    var pts=verts.map(project),faces=[[0,1,2,3],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]];
    faces.sort(function(f,g){return f.reduce(function(s,n){return s+pts[n][1];},0)-g.reduce(function(s,n){return s+pts[n][1];},0);});
    faces.forEach(function(f,i){body+='<polygon points="'+f.map(function(n){return pts[n].join(',');}).join(' ')+'" class="solid-face" opacity="'+(.22+i*.06)+'"/>';});
    for(i=1;i<c;i++){var l=[project([0,0,i]),project([a,0,i]),project([a,b,i]),project([0,b,i]),project([0,0,i])];body+='<polyline points="'+l.map(function(v){return v.join(',');}).join(' ')+'" class="grid-stroke" fill="none"/>';}
    body+=txt(280,265,a+' × '+b+' × '+c+' = '+a*b*c+' куб. ед.');
    form=controls([['a','Длина',1,10,a],['b','Ширина',1,10,b],['c','Слои',1,10,c],['rotation','Поворот',0,360,angle]]);
    caption='Вращай объёмную модель и меняй число слоёв. Один слой содержит длина × ширина единичных кубиков. Поворот не меняет объём.';
   }else if(k==='percent'){
    var count=p.percent;
    for(i=0;i<100;i++)body+='<rect x="'+(135+i%10*22)+'" y="'+(10+Math.floor(i/10)*22)+'" width="19" height="19" rx="3" class="'+(i<count?'fill':'empty')+'"/>';
    body+=txt(280,267,count+'% от '+p.total+' = '+Number((p.total*count/100).toFixed(4)));
    form=controls([['percent','Проценты',0,100,count]]);
    caption='Каждая клетка — одна сотая целого. Попробуй 1%, 25%, 50%, затем верни исходное значение.';
   }else if(k==='ratio'||k==='bars'){
    var width=420,total=a+b,x0=65;
    body+='<rect x="'+x0+'" y="65" width="'+width*a/total+'" height="58" class="fill"/><rect x="'+(x0+width*a/total)+'" y="65" width="'+width*b/total+'" height="58" class="warm-fill"/>';
    body+=txt(x0+width*a/total/2,154,a)+txt(x0+width*a/total+width*b/total/2,154,b)+txt(280,210,'Отношение '+a+':'+b+' · Доля первой части '+a+'/'+total);
    form=controls([['a','Первая часть',1,Math.max(12,a),a],['b','Вторая часть',1,Math.max(12,b),b]]);
    caption='Называй целое перед вычислением. Отношение первой части ко второй и доля первой части от общего — разные числа.';
   }else if(k==='motion'){
    var time=Number(p.time)||1,speed=Number(p.speed)||1,now=p.now===undefined?time:p.now;
    body=line(55,160,505,160)+txt(55,200,'Старт')+txt(505,200,speed*time+' км');
    body+='<circle cx="'+(55+450*now/time)+'" cy="160" r="15" class="fill"/>'+txt(280,80,'Время '+now+' ч · Путь '+Number((speed*now).toFixed(2))+' км');
    form=controls([['now','Время движения',0,time,now,.1],['speed','Скорость',1,15,speed]]);
    caption='Перемещай время: равным промежуткам времени при постоянной скорости соответствуют равные участки пути.';
   }else if(k==='chart'){
    var vals=p.values,max=Math.max.apply(null,vals.concat([1])),spacing=440/vals.length,barWidth=Math.min(72,spacing-16);
    vals.forEach(function(v,i){var h=v/max*160,cx=70+spacing*(i+.5);body+='<rect x="'+(cx-barWidth/2)+'" y="'+(205-h)+'" width="'+barWidth+'" height="'+h+'" class="fill"/>'+txt(cx,225,['Пн','Вт','Ср','Чт','Пт'][i])+txt(cx,190-h,v);});
    body+=line(70,205,515,205);form=controls(vals.map(function(v,i){return ['bar'+i,['Понедельник','Вторник','Среда','Четверг','Пятница'][i],0,60,v];}));
    caption='Меняй данные и наблюдай высоту столбиков. Читай подписанные значения; масштаб меняется вместе с наибольшим значением.';
   }else if(k==='multiples'){
    var divs=function(n){var v=[];for(var i=1;i<=n;i++)if(n%i===0)v.push(i);return v;};
    body=txt(280,70,'Делители '+a+': '+divs(a).join(', '))+txt(280,122,'Делители '+b+': '+divs(b).join(', '))+txt(280,188,'НОД = '+root.WorkshopMath.gcd(a,b))+txt(280,230,'НОК = '+a*b/root.WorkshopMath.gcd(a,b));
    form=controls([['a','Первое число',2,Math.max(60,a),a],['b','Второе число',2,Math.max(60,b),b]]);
    caption='Сравни общие делители и общие кратные. Заметь случаи взаимно простых чисел и случай, когда одно число делится на другое.';
   }else if(k==='place'||k==='decimal'){
    var val=k==='decimal'?String(p.n/p.d):String(p.n),digits=val.split(''),w=Math.min(65,450/digits.length);
    digits.forEach(function(v,i){body+='<rect x="'+(50+i*w)+'" y="70" width="'+(w-3)+'" height="65" class="empty"/>'+txt(50+i*w+w/2,112,v==='.'?',':v);});
    body+=txt(280,205,k==='decimal'?p.n+' долей размера 1/'+p.d:'Число = сумма разрядных слагаемых');
    form=controls([['n',k==='decimal'?'Число долей':'Число',0,Math.max(1000,p.n),p.n]]);
    caption=k==='decimal'?'Меняй число десятых или сотых. Проследи, как десять долей обмениваются на единицу старшего разряда.':'Измени число и объясни значение каждой цифры. Положение важнее внешнего вида цифры.';
   }else if(k==='power'){
    body=txt(280,85,a+' в степени '+b)+txt(280,155,Array(b).fill(a).join(' × '))+txt(280,225,Math.pow(a,b));form=controls([['a','Основание',2,9,a],['b','Показатель',1,5,b]]);caption='Показатель задаёт число одинаковых множителей. Сравни степень с обычным умножением основания на показатель.';
   }else if(k==='balance'){
    var v=p.test===undefined?p.x:p.test,L=a*v+b,right=a*p.x+b;
    body=line(100,120,460,120)+line(280,120,280,220)+line(210,220,350,220)+txt(160,82,a+' × '+v+' + '+b+' = '+L)+txt(415,82,right)+txt(280,265,L===right?'Равновесие: корень найден':L<right?'Левая часть меньше':'Левая часть больше');
    form=controls([['test','Проверяемое x',0,20,v]]);
    caption='Подставляй значения и сравнивай две части. Найденное равенство проверяет корень, но при решении объясни каждую операцию.';
   }else if(k==='circle'){
    var r=p.r||4;body='<circle cx="250" cy="130" r="'+r*10+'" class="circle-fill"/>'+line(250,130,250+r*10,130)+txt(250,130-r*10-15,'r = '+r)+txt(280,260,'Диаметр '+2*r+' · Площадь при π = 3,14: '+Number((3.14*r*r).toFixed(2)));
    form=controls([['r','Радиус',1,10,r]]);caption='Меняй радиус и сравни диаметр и площадь. Удвоение радиуса увеличивает диаметр вдвое, площадь — вчетверо.';
   }else if(k==='triangle'){
    a=p.a||50;b=p.b||50;body='<polygon points="100,220 430,220 240,40" class="triangle-fill"/>'+txt(132,205,a+'°')+txt(395,205,b+'°')+txt(242,70,(180-a-b)+'°');
    form=controls([['a','Первый угол',10,80,a],['b','Второй угол',10,80,b]]);caption='Подписи показывают сумму углов. Схема условная и не является чертежом в масштабе: вывод делай по значениям, а не по виду.';
   }else if(k==='sets'){
    body='<circle cx="220" cy="130" r="95" class="circle-fill"/><circle cx="340" cy="130" r="95" class="warm-circle"/>'+txt(185,135,a-p.c)+txt(280,135,p.c)+txt(378,135,b-p.c)+txt(280,260,'Хотя бы одно: '+(a+b-p.c));
    form=controls([['c','В обоих множествах',0,Math.min(a,b),p.c]]);
    caption='Средняя область принадлежит обоим множествам. При подсчёте объединения учитывай её один раз.';
   }else if(k==='parallel'){
    body=line(75,95,490,95)+line(75,190,490,190)+line(150,50,150,240,'accent-stroke')+txt(420,70,'a')+txt(420,168,'b');
    form=controls([['gap','Расстояние между прямыми',30,140,p.gap||95]]);body=line(75,145-(p.gap||95)/2,490,145-(p.gap||95)/2)+line(75,145+(p.gap||95)/2,490,145+(p.gap||95)/2)+line(150,30,150,260,'accent-stroke');
    caption='Меняй расстояние. Обе горизонтальные прямые перпендикулярны одной вертикальной; они остаются параллельными.';
   }else{
    var vals=p.values||[2,3,4];body=txt(280,90,'Сначала скобки, затем умножение, затем сложение')+txt(280,160,vals[0]+' + '+vals[1]+' × '+vals[2]+' = '+(vals[0]+vals[1]*vals[2]));form=controls([['v','Значение в скобках',1,10,vals[2]]]);caption='Проверь, как значение внутри скобок влияет на весь результат.';
   }
   var html='<div class="model-visual">'+svg(body,caption,svgHeight)+'</div>'+form+'<p class="model-caption">'+esc(caption)+'</p><button type="button" class="quiet" data-reset>Вернуть числа из задачи</button><p class="tiny">Это исследование модели. Изменение ползунков не меняет условие задания ниже.</p>';
   if(keep){var temp=document.createElement('div');temp.innerHTML=html;el.querySelector('.model-visual').innerHTML=temp.querySelector('.model-visual').innerHTML;el.querySelector('.model-caption').textContent=temp.querySelector('.model-caption').textContent;el.querySelectorAll('[data-param]').forEach(function(input){var fresh=temp.querySelector('[data-param="'+input.dataset.param+'"]');if(fresh){input.min=fresh.min;input.max=fresh.max;input.value=fresh.value;input.nextElementSibling.value=fresh.value;}});}else el.innerHTML=html;
   if(k==='coordinate'){
    var canvas=el.querySelector('svg'),move=function(e){var rect=canvas.getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width*560,y=(e.clientY-rect.top)/rect.height*290;selected={x:Math.max(-5,Math.min(5,Math.round((x-280)/34))),y:Math.max(-4,Math.min(4,Math.round((145-y)/26)))};draw(true);};
    canvas.addEventListener('click',move);
   }
  }
  el.addEventListener('input',function(e){var input=e.target;if(!input.dataset.param)return;var key=input.dataset.param,v=Number(input.value);if(p.kind==='coordinate')selected[key]=v;else if(key==='rotation')angle=v;else if(key.indexOf('bar')===0){p.values=p.values.slice();p.values[Number(key.slice(3))]=v;}else if(key==='v')p.values=[p.values[0],p.values[1],v];else p[key]=v;draw(true);});
  el.addEventListener('click',function(e){if(e.target.closest('[data-reset]')){p=Object.assign({},original);selected={x:0,y:0};angle=35;draw();}var cell=e.target.closest('[data-cell]');if(cell){p.n=Number(cell.dataset.cell)+1;draw(true);}});
  draw();
 }
 root.WorkshopModels={mount:mount};
})(window);
