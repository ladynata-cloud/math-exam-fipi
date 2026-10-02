(function(root){
'use strict';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const gcd=(a,b)=>b?gcd(b,a%b):a,lcm=(a,b)=>a*b/gcd(a,b),num=q=>q.n/q.d;
function fractionState(p,M){const a=M.q(p.an,p.ad),b=M.q(p.bn,p.bd);return {a,b,common:lcm(p.ad,p.bd),answer:p.op==='add'?M.add(a,b):p.op==='subtract'?M.sub(a,b):p.op==='multiply'?M.mul(a,b):p.op==='divide'?(p.bn?M.div(a,b):null):p.op==='compare'?(num(a)>num(b)?'>':num(a)<num(b)?'<':'='):a};}
function decimalState(p,M){const a=M.q(p.ac,100),b=M.q(p.bc,100);return {a,b,answer:p.op==='subtract'?M.sub(a,b):p.op==='multiply'?M.mul(a,b):p.op==='divide'?(p.bc?M.div(a,b):null):M.add(a,b)};}
function divisionRows(n,d){let rem=0;return String(n).split('').map(digit=>{const current=rem*10+Number(digit),q=Math.floor(current/d);rem=current-q*d;return {digit:Number(digit),current,q,product:q*d,remainder:rem};});}
function mount(el,m,M,old){
 if(m.kind!=='v5lab')return old(el,m);
 const kind=m.family,d=m.data||{},op=m.op||'add';
 if(!['fraction','decimal','number','column','longdivision','angle','circle'].includes(kind)){
  const aliases={chart:{kind:'chart',values:d.values||[d.a*5,d.b*5,d.c*5]},line:{kind:'line',a:d.start??d.low??d.a,b:d.end?d.end-(d.start||0):d.b},array:{kind:'array',a:Math.min(12,d.a),b:Math.min(12,d.b)},area:{kind:'area',a:d.a,b:d.b},solid:{kind:'solid',a:d.a,b:d.b,c:d.c},circle:{kind:'angle',angle:90},motion:{kind:'motion',speed:d.speed,time:d.time},factors:{kind:'multiples',a:d.n||d.a,b:d.b},equation:{kind:'balance',a:1,b:d.b,x:d.x||d.a}};
  old(el,aliases[kind]||{kind:'line',a:0,b:5});el.insertAdjacentHTML('afterbegin','<p class="tiny">Отдельная модель для исследования. Изменения здесь не меняют условие задачи ниже.</p>');return;
 }
 const p={op,an:op==='subtract'?5:op==='divide'?3:2,ad:op==='subtract'?4:op==='divide'?2:3,bn:1,bd:op==='multiply'?2:4,common:0,parts:0,reveal:false,ac:op==='subtract'?300:68,bc:op==='subtract'?48:57,exchange:[3,0,0],factor:1,step:0,angle:30};
 if(kind==='fraction'&&op==='multiply'){p.an=3;p.ad=4;p.bn=2;p.bd=3;}
 if(kind==='decimal'&&op==='divide'){p.ac=150;p.bc=25;}if(kind==='decimal'&&op==='multiply'){p.ac=60;p.bc=40;}
 p.radius=d.a||4;p.original=d.n||d.x||300;if(['number','column'].includes(kind))p.exchange=[Math.floor(p.original/100),Math.floor(p.original/10)%10,p.original%10];let notice='';
 const control=(key,label,min,max,value,step=1)=>'<label>'+label+'<input type="number" data-param="'+key+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+value+'"></label>';
 const btn=(text,action)=>'<button type="button" class="quiet" data-action="'+action+'">'+text+'</button>';
 const svg=(body,label,h=240)=>'<svg viewBox="0 0 600 '+h+'" role="img" aria-label="'+esc(label)+'">'+body+'</svg>';
 const txt=(x,y,text)=>'<text x="'+x+'" y="'+y+'">'+esc(text)+'</text>';
 const rect=(x,y,w,h,cl)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" class="'+cl+'"/>';
 function bar(n,den,y,partition,label){const total=Math.max(1,Math.ceil(n/den)),limit=Math.max(2,Math.ceil(p.an/p.ad),Math.ceil(p.bn/p.bd),Math.ceil(p.an/p.ad+p.bn/p.bd)),unit=480/limit;let s=txt(15,y+23,label);for(let i=0;i<total;i++){s+=rect(60+i*unit,y,unit-2,35,'v5-empty');s+=rect(60+i*unit,y,Math.max(0,Math.min(1,n/den-i))*(unit-2),35,'v5-teal');const divs=partition||den;for(let j=1;j<divs;j++)s+='<path d="M '+(60+i*unit+j*(unit-2)/divs)+' '+y+' v 35" class="v5-line"/>';s+=txt(60+i*unit,y+55,'1 целое');}return s;}
 function draw(){let body='',controls='',title='',question='',target,caption='',actions='';
  if(kind==='fraction'){
   const s=fractionState(p,M);target=s.answer;
   const names={parts:'Собери дробь своими руками',equivalent:'Дробим части, сохраняя целое',compare:'Сравниваем одинаковые целые',add:'Соединяем доли',subtract:'Убираем доли',multiply:'Берём долю от доли',divide:'Измеряем запас порциями'};title=names[op];
   controls=control('an','Числитель первой дроби',0,24,p.an)+control('ad','Её знаменатель',2,12,p.ad);
   if(!['parts','equivalent'].includes(op))controls+=control('bn','Числитель второй дроби',op==='divide'?1:0,24,p.bn)+control('bd','Её знаменатель',2,12,p.bd);
   if(['add','subtract','compare','equivalent','parts'].includes(op)){
    body=bar(p.an,p.ad,30,p.common,'A');if(!['parts','equivalent'].includes(op))body+=bar(p.bn,p.bd,120,p.common,'B');
    if(op==='equivalent'){controls+=control('factor','На сколько частей разрезать каждую долю',1,6,p.factor);body+=bar(p.an*p.factor,p.ad*p.factor,120,0,'A');caption='Число частей выросло, но закрашенная длина осталась прежней: '+p.an+'/'+p.ad+' = '+p.an*p.factor+'/'+p.ad*p.factor+'.';target=M.q(p.an*p.factor,p.ad*p.factor);question='Какое число изображено на обеих полосках?';}
    else if(op==='parts'){caption='Каждая длинная полоска — одна и та же единица. Выбрано '+p.an+' долей по 1/'+p.ad+'.';question='Запиши изображённое число.';}
    else {controls+=control('partition','Предложи общий знаменатель',2,144,p.common||s.common);actions+=btn('Разбить на одинаковые доли','partition');
     caption=p.common?'Теперь единица разделена на '+p.common+' частей: A = '+p.an*p.common/p.ad+'/'+p.common+', B = '+p.bn*p.common/p.bd+'/'+p.common+'.':'Сначала добейся одного размера долей. Длины целых всегда одинаковые.';
     if(op==='add'||op==='subtract'){actions+=btn(op==='add'?'Соединить доли':'Убрать вторую часть','combine');if(p.reveal){if(num(s.answer)>=0)body+=bar(s.answer.n,s.answer.d,210,p.common,'Итог');else body+=txt(60,230,'Вторая часть больше первой — получится отрицательное число.');caption+=' '+(op==='add'?'Складываем количества долей.':'Вычитаем количества долей.');}}
     question=op==='compare'?'Сравни A и B. Введи <, > или =.':'Чему равно A '+(op==='add'?'+':'−')+' B?';}
    body=svg(body,title,p.reveal?290:210);
   }else if(op==='multiply'){
    const ax=p.an/p.ad,by=p.bn/p.bd,w=220,h=130,wide=Math.max(1,ax),high=Math.max(1,by),sc=Math.min(w/wide,h/high);let grid=rect(70,35,wide*sc,high*sc,'v5-empty');grid+=rect(70,35,ax*sc,high*sc,'v5-blue');if(p.reveal)grid+=rect(70,35,ax*sc,by*sc,'v5-teal');for(let i=0;i<=Math.ceil(wide*p.ad);i++)grid+='<path d="M '+(70+i*sc/p.ad)+' 35 v '+high*sc+'" class="v5-line"/>';for(let j=0;j<=Math.ceil(high*p.bd);j++)grid+='<path d="M 70 '+(35+j*sc/p.bd)+' h '+wide*sc+'" class="v5-line"/>';grid+=txt(340,65,'Ширина: '+M.fmt(s.a))+txt(340,105,'Высота: '+M.fmt(s.b))+txt(70,210,'Квадрат 1 × 1 — единица площади');body=svg(grid,title);actions=btn('Взять вторую долю от первой','combine');caption='Меняй обе дроби. Сначала выделяем ширину, затем берём указанную высоту. Пересечение показывает произведение; каждая малая клетка — 1/'+(p.ad*p.bd)+' квадратной единицы.';question='Чему равна площадь пересечения в квадратных единицах?';
   }else{
    const ratio=num(s.answer),shown=Math.min(p.parts,ratio),sc=450/Math.max(1,num(s.a),num(s.b)),y=80;
    let grid=rect(60,y,num(s.a)*sc,45,'v5-empty');for(let i=0;i<Math.ceil(shown);i++){const fraction=Math.min(1,shown-i);grid+=rect(60+i*num(s.b)*sc,y,Math.max(0,fraction*num(s.b)*sc-2),45,i%2?'v5-blue':'v5-teal');}grid+=txt(60,45,'Запас A = '+M.fmt(s.a))+txt(60,155,'Одна порция B = '+M.fmt(s.b))+txt(60,200,'Разложено полных порций: '+Math.floor(shown));body=svg(grid,title);actions=btn('+ одна целая порция','portion')+btn('Взять оставшуюся часть порции','partial')+btn('Начать разложение сначала','clear-portions');caption='Частное — число порций, а не оставшийся объём. Если целая порция больше остатка, измерь, какую часть порции он составляет.';if(p.parts>Math.floor(ratio)&&!Number.isInteger(ratio))caption+=' Остаток составляет '+M.fmt(M.sub(s.answer,Math.floor(ratio)))+' порции.';question='Сколько всего порций размера B содержится в A? Можно ответить дробью.';
   }
  }else if(kind==='decimal'){
   title={add:'Складываем сотые и обмениваем разряды',subtract:'Разменяем единицу перед вычитанием',multiply:'Почему меняется место запятой',divide:'Меняем единицы, сохраняя частное'}[op];const s=decimalState(p,M);target=s.answer;
   controls=control('ac','Первое число (сотых)',0,999,p.ac)+control('bc','Второе число (сотых)',op==='divide'?1:0,999,p.bc);
   const dec=q=>String(num(q)).replace('.',',');
   if(op==='add'||op==='subtract'){
    let rows=[['Первое число',dec(s.a),Math.floor(p.ac/100),Math.floor(p.ac/10)%10,p.ac%10],['Второе число',dec(s.b),Math.floor(p.bc/100),Math.floor(p.bc/10)%10,p.bc%10]];
    rows.push([p.added?'Сумма после обменов':'Первое после разменов',dec(M.q(p.exchange[0]*100+p.exchange[1]*10+p.exchange[2],100)),...p.exchange]);
    body='<div class="v5-table-wrap"><table><caption>Одинаковые разряды стоят друг под другом</caption><thead><tr><th>Число</th><th>Запись</th><th>Целые</th><th>Десятые</th><th>Сотые</th></tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(x=>'<td>'+x+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
    actions=btn('1 целая → 10 десятых','exchange-whole')+btn('1 десятая → 10 сотых','exchange-tenth')+btn('10 сотых → 1 десятая','collect-tenth')+btn('10 десятых → 1 целая','collect-whole');
    if(op==='add')actions+=btn('Добавить разряды второго числа','add-digits');
    caption='Размены сохраняют значение первой строки. '+(op==='add'?'Добавь второе число, затем собери полные десятки.':'Добейся, чтобы в каждом разряде хватало единиц для вычитания.');question='Вычисли '+dec(s.a)+(op==='add'?' + ':' − ')+dec(s.b)+'.';
   }else if(op==='multiply'){
    const w=220,h=130,x=num(s.a),y=num(s.b),scale=Math.min(w/Math.max(1,x),h/Math.max(1,y));body=svg(rect(60,30,Math.max(1,x)*scale,Math.max(1,y)*scale,'v5-empty')+rect(60,30,x*scale,y*scale,'v5-teal')+txt(330,65,dec(s.a)+' = '+p.ac+'/100')+txt(330,105,dec(s.b)+' = '+p.bc+'/100')+txt(60,205,'Единица площади — квадрат 1 × 1'),title);caption='Сотая от сотой — одна десятитысячная. Произведение равно '+p.ac+' · '+p.bc+' / 10 000. Для десятых можно сократить запись. Поменяй числа и сравни площадь.';question='Вычисли '+dec(s.a)+' · '+dec(s.b)+'.';
   }else{
    controls+=control('factor','Увеличить оба числа во столько раз',1,1000,p.factor);body='<div class="v5-equivalence"><span>'+dec(s.a)+' : '+dec(s.b)+'</span><b>=</b><span>'+dec(M.mul(s.a,p.factor))+' : '+dec(M.mul(s.b,p.factor))+'</span></div>';caption='Делимое и делитель меняются вместе. Выбери множитель 10 или 100, чтобы делитель стал целым. Частное сохраняется. При делителе меньше единицы результат может быть больше делимого.';question='Чему равно частное?';
   }
  }else if(kind==='longdivision'){
   title='Деление уголком: каждый разряд на своём месте';const n=d.total||612,divisor=d.divisor||3,rows=divisionRows(n,divisor);target=Math.floor(n/divisor);body='<p class="v5-equivalence">'+n+' : '+divisor+'</p><ol class="v5-division">'+rows.slice(0,p.step).map((r,i)=>'<li>Сносим '+r.digit+'. Получаем '+r.current+'.<br>Цифра частного <b>'+r.q+'</b>, вычитаем '+r.product+', остаток '+r.remainder+'.</li>').join('')+'</ol>';actions=btn('Выполнить следующий разряд','division-step');caption='Подбери очередную цифру частного до нажатия. Ноль — тоже цифра частного: без него следующий разряд сдвинется.';question='Чему равно полное частное?';
  }else if(kind==='circle'){
   title='Круг и его граница';target=2*p.radius;controls=control('radius','Радиус',1,10,p.radius);const r=12*p.radius;
   body=svg('<circle cx="210" cy="135" r="'+r+'" class="v5-blue"/><circle cx="210" cy="135" r="'+r+'" fill="none" stroke="#137b68" stroke-width="4"/><path d="M '+(210-r)+' 135 H '+(210+r)+'" class="v5-ray"/>'+txt(360,100,'Радиус: '+p.radius)+txt(360,140,'Диаметр: ?')+txt(360,180,'Круг — вся область'),title,280);caption='Оранжевая область — круг; зелёная граница — окружность. Диаметр проходит через центр и содержит два радиуса. Изменяй радиус и предсказывай длину диаметра.';question='Какова длина диаметра?';
  }else if(kind==='angle'){
   title='Построй угол и проверь шкалу';const targetAngle=d.target?d.target-(d.start||0):d.deg||65;target=targetAngle;
   controls='<label>Поворот второго луча<input type="range" data-param="angle" min="0" max="180" value="'+p.angle+'"><output>'+p.angle+'°</output></label>';
   let grid='';for(let i=0;i<=180;i+=10){const r=i*Math.PI/180;grid+='<path d="M '+(270+155*Math.cos(r))+' '+(200-155*Math.sin(r))+' L '+(270+165*Math.cos(r))+' '+(200-165*Math.sin(r))+'" class="v5-line"/>';if(i%30===0)grid+=txt(263+185*Math.cos(r),204-185*Math.sin(r),i);}
   const r=p.angle*Math.PI/180;grid+='<path d="M 455 200 L 270 200 L '+(270+175*Math.cos(r))+' '+(200-175*Math.sin(r))+'" class="v5-ray"/>';body=svg(grid,title);caption='Поставь второй луч на '+targetAngle+'°. Ползунок работает стрелками клавиатуры. Ноль находится справа; длины лучей не влияют на угол.';actions=btn('Проверить построение','angle-check');question='Какова градусная мера заданного угла?';
  }else{
   title='Разрядная мастерская';target=p.original;
   body='<p>Исследуем число <b>'+p.original+'</b>. Меняй единицы счёта, сохраняя величину.</p><div class="v5-place">'+p.exchange.map((v,i)=>'<div><b>'+v+'</b><span>'+['сотен','десятков','единиц'][i]+'</span></div>').join('')+'</div>';
   actions=btn('1 целая → 10 десятых','exchange-whole')+btn('1 десятая → 10 сотых','exchange-tenth')+btn('10 сотых → 1 десятая','collect-tenth')+btn('10 десятых → 1 целая','collect-whole');actions=actions.replaceAll('1 целая → 10 десятых','1 сотня → 10 десятков').replaceAll('1 десятая → 10 сотых','1 десяток → 10 единиц').replaceAll('10 сотых → 1 десятая','10 единиц → 1 десяток').replaceAll('10 десятых → 1 целая','10 десятков → 1 сотня');caption='Размен сохраняет число. После каждого обмена пересчитай сотни, десятки и единицы. Можно разменять несколько раз и затем собрать обратно.';question='Какое число представлено сейчас?';
  }
  if(kind==='fraction'){
   const goal={add:'Собери ровно 1 из двух ненулевых дробей.',subtract:'Получи разность 1/2 из двух ненулевых дробей.',multiply:'Получи произведение 1/2, меняя обе дроби.',divide:'Раздели запас ровно на 3 порции.',compare:'Сделай две равные дроби с разными знаменателями.',parts:'Изобрази ровно 3/2.',equivalent:'Изобрази 1/2 двумя разными записями.'}[op];
   actions+=btn('Миссия: '+goal,'mission-check');
  }
  el.innerHTML='<section class="panel v5-lab"><p class="eyebrow">Исследую сам</p><h2>'+title+'</h2><p class="tiny">Лаборатория — отдельный пример. Её настройки не меняют задачу ниже и не засчитываются как самостоятельная проверка.</p><div class="v5-controls">'+controls+'</div>'+body+'<div class="row">'+actions+'</div><p class="v5-caption">'+caption+'</p><form class="v5-lab-form"><label>'+question+'<input name="prediction" autocomplete="off" aria-label="Ответ в лаборатории"></label><button>Проверить вывод</button></form><p class="v5-feedback" role="status">'+esc(notice)+'</p></section>';
  el.querySelectorAll('[data-param]').forEach(input=>input.onchange=()=>{const key=input.dataset.param,value=Number(input.value);if(!Number.isFinite(value)||value<Number(input.min)||value>Number(input.max)||!Number.isInteger(value)){notice='Введи целое число в указанном диапазоне.';draw();return;}if(key==='partition')return;p[key]=value;p.common=0;p.reveal=false;p.parts=0;if(['ac','bc'].includes(key)){p.exchange=[Math.floor(p.ac/100),Math.floor(p.ac/10)%10,p.ac%10];p.added=false;}notice='';draw();el.querySelector('[data-param="'+key+'"]')?.focus();});
  el.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>{const action=b.dataset.action;notice='';
   if(action==='mission-check'){
    const f=fractionState(p,M),expected=op==='add'?1:op==='divide'?3:op==='parts'?M.q(3,2):M.q(1,2);
    let ok=op==='compare'?M.equal(M.fmt(f.a),f.b)&&p.ad!==p.bd:op==='equivalent'?M.equal(M.fmt(f.a),expected)&&p.factor>1:f.answer!==null&&M.equal(M.fmt(f.answer),expected);
    if(['add','subtract','multiply','divide'].includes(op))ok=ok&&p.an>0&&p.bn>0;
    notice=ok?'Миссия выполнена! Объясни найденный способ и попробуй найти второй.':'Пока цель не достигнута. Изменяй числители и знаменатели, затем проверяй снова.';
   }
   if(action==='partition'){const n=Number(el.querySelector('[data-param="partition"]').value);if(!Number.isInteger(n)||n<2||n>144||n%p.ad||n%p.bd)notice='Число должно делиться на оба знаменателя, чтобы новые доли были равными.';else p.common=n;}
   if(action==='combine'){if(['add','subtract'].includes(op)&&!p.common)notice='Сначала выбери и проверь общий знаменатель.';else p.reveal=true;}
   if(action==='portion'){const s=fractionState(p,M);if(p.parts+1<=num(s.answer))p.parts++;else notice='Ещё целая порция не помещается. Посмотри, остался ли запас для части порции.';}
   if(action==='partial'){const s=fractionState(p,M);if(p.parts<Math.floor(num(s.answer)))notice='Сначала разложи все полные порции.';else p.parts=num(s.answer);}
   if(action==='clear-portions')p.parts=0;
   if(action==='exchange-whole'){if(p.exchange[0]>0){p.exchange[0]--;p.exchange[1]+=10;}else notice='Целых для размена больше нет.';}
   if(action==='exchange-tenth'){if(p.exchange[1]>0){p.exchange[1]--;p.exchange[2]+=10;}else notice='Сначала получи хотя бы одну десятую.';}
   if(action==='collect-tenth'){if(p.exchange[2]>=10){p.exchange[2]-=10;p.exchange[1]++;}else notice='Нужно десять сотых для обмена.';}
   if(action==='collect-whole'){if(p.exchange[1]>=10){p.exchange[1]-=10;p.exchange[0]++;}else notice='Нужно десять десятых для обмена.';}
   if(action==='add-digits'){if(p.added)notice='Второе число уже добавлено. Теперь собери полные разряды.';else{p.exchange[0]+=Math.floor(p.bc/100);p.exchange[1]+=Math.floor(p.bc/10)%10;p.exchange[2]+=p.bc%10;p.added=true;}}
   if(action==='division-step')p.step=Math.min(p.step+1,divisionRows(d.total||612,d.divisor||3).length);
   if(action==='angle-check')notice=p.angle===(d.target?d.target-(d.start||0):d.deg||65)?'Построение верное. Объясни, от какого нуля вёл отсчёт.':'Проверь ноль шкалы и поверни луч ещё.';
   draw();el.querySelector('[data-action="'+action+'"]')?.focus();});
  el.querySelector('.v5-lab-form').onsubmit=e=>{e.preventDefault();const text=new FormData(e.target).get('prediction');notice=target!==null&&M.equal(text,target)?'Верно. Теперь объясни результат по модели и попробуй другие числа.':'Пока не совпало. Назови целое, размер доли и нужное действие; проверь ещё раз.';el.querySelector('.v5-feedback').textContent=notice;};
 }
 if(kind==='decimal')p.exchange=[Math.floor(p.ac/100),Math.floor(p.ac/10)%10,p.ac%10];draw();
}
function install(B,M){const old=B.mount;B.mount=(el,m)=>mount(el,m,M,old);}
const API={fractionState,decimalState,divisionRows,install};if(typeof module!=='undefined'&&module.exports)module.exports=API;else{root.WorkshopV5Models=API;install(root.WorkshopModels,root.WorkshopMath);}
})(typeof window!=='undefined'?window:globalThis);
