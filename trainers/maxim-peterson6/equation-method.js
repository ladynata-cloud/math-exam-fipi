(function(root){
'use strict';
// Revision 2 is applied only to new work. The original generators in index.html
// remain the reader for revision-1 histories and unfinished attempts.
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const frac=(n,d)=>'{{frac:'+n+':'+d+'}}';
function rich(value){
 const text=String(value),pattern=/\{\{frac:([^{}:]+):([^{}:]+)\}\}|(-?\d+)\/(\d+)/g;let out='',at=0,m;
 while((m=pattern.exec(text))){out+=escape(text.slice(at,m.index));const n=m[1]===undefined?m[3]:m[1],d=m[2]===undefined?m[4]:m[2];out+='<span class="equation-fraction" role="math" aria-label="'+escape(n+' делить на '+d)+'"><span>'+rich(n)+'</span><span>'+rich(d)+'</span></span>';at=pattern.lastIndex;}
 return out+escape(text.slice(at));
}
function plain(value){return String(value).replace(/\{\{frac:([^{}:]+):([^{}:]+)\}\}/g,(_,n,d)=>'('+n+')/('+d+')');}
function hash(text){let n=2166136261;for(const c of String(text)){n^=c.charCodeAt(0);n=Math.imul(n,16777619);}return n>>>0;}
const wordModules=['time','meeting','chase','ratio','river','percent-tasks','river-units','river-percent','raft-percent','joint-work'];
function transform(source,helpers){
 const p=JSON.parse(JSON.stringify(source)),m=p.meta||{},f=helpers.fmt,n=helpers.num,t=p.type;
 if(!wordModules.includes(p.module)||p.module==='time'&&['minutes','hours'].includes(t))return p;
 let steps=[],unknown='',unit='',equation='',answer=null;
 function choice(label,correct,others,hint,explanation){
  const labels=[...new Set([correct,...others])];
  const options=labels.map((s,i)=>['v'+i,s]).sort((a,b)=>hash(p.prompt+label+a[1])-hash(p.prompt+label+b[1]));
  return {kind:'choice',rich:true,label,expected:'v0',options,hint,explanation};
 }
 function identify(meaning,u,others){unknown=meaning;unit=u;return choice('Что обозначим буквой x?',meaning+' ('+u+')',others||['Число из условия ('+u+')','Сумму всех данных'], 'Выбери одну неизвестную величину и её единицу. Буква x сохраняет этот смысл во всём решении.', 'Пусть x — '+meaning.toLowerCase()+', '+u+'.');}
 function model(correct,others,hint){equation=correct;return choice('Как записать связь величин через x?',correct,others,hint,'По условию: '+correct+'.');}
 function value(label,expected,u,hint,explanation){return n(label,expected,u,hint,explanation);}
 function verify(correct,others){return choice('Какая проверка подтверждает ответ по условию?',correct,others,'Подставь найденные значения в исходное условие. Проверь также единицы и вопрос задачи.',correct+'. Условия выполнены.');}
 function solve(expected,u,hint,explanation){answer=expected;return value('Найди x. Введи значение в '+u+'.',expected,u,hint,explanation);}
 const checkRate=(v,time,distance)=>f(v)+' · '+f(time)+' = '+f(distance);
 if(t==='ratio-meet'||t==='textbook-303'){
  const r=m.r===undefined?m.ratio:m.r,D=m.s===undefined?m.distance:m.s,c=1+r,second=D/c,first=second*r;
  steps=[identify('Скорость второго поезда','км/ч',['Путь второго поезда (км)','Время до встречи (ч)']),
   choice('x > 0. Как выразить скорость первого поезда?',f(r)+'x',[f(r)+' + x','x : '+f(r)],'«В '+f(r)+' раза больше» означает умножить x на '+f(r)+'.','Скорость первого — '+f(r)+'x км/ч.'),
   value('Скорость сближения — x + '+f(r)+'x. Введи коэффициент перед x.',c,'','Сложи коэффициенты: 1 + '+f(r)+'.','Скорость сближения: '+f(c)+'x км/ч.'),
   model('t = '+frac(f(D),f(c)+'x')+' = '+frac(f(second),'x'),['t = '+frac(f(D),f(r)+'x'),'t = '+f(D)+' · '+f(c)+'x'],'Время до встречи — всё расстояние, делённое на скорость сближения.'),
   value('Первый путь: '+f(r)+'x · '+frac(f(second),'x')+'. Сколько это километров?',first,'км','x в числителе и знаменателе сокращается, потому что x > 0. Умножь оставшиеся числа.',f(r)+'x · '+frac(f(second),'x')+' = '+f(first)+' км. Отдельную скорость x находить не нужно.'),
   verify(f(first)+' + '+f(second)+' = '+f(D)+'; '+f(first)+' : '+f(second)+' = '+f(r),[f(first)+' − '+f(second)+' = '+f(D),'x = '+f(second)+' км/ч'])];
  answer=first;p.title='Навстречу: скорость x, время и путь';p.diagram={...p.diagram,v1:f(r)+'x',v2:'x',symbolic:true};
 }else if(t==='ratio-away'||t==='textbook-305'){
  const r=m.r===undefined?m.ratio:m.r,time=m.t===undefined?m.time:m.t,D=m.s===undefined?m.distance:m.s,slow=D/(time*(1+r)),fast=r*slow,timeText=t==='textbook-305'?'4/3':f(time);
  steps=[value('Переведи время движения в часы.',time,'ч','Минуты раздели на 60.',f(time*60)+' мин = '+f(time)+' ч.'),
   identify('Скорость велосипедиста','км/ч',['Скорость мотоциклиста (км/ч)','Общее расстояние (км)']),
   choice('Как выразить скорость мотоциклиста?',f(r)+'x',['x + '+f(r),'x : '+f(r)],'Мотоциклист движется в '+f(r)+' раза быстрее.','Его скорость — '+f(r)+'x км/ч; скорость удаления — x + '+f(r)+'x.'),
   model(timeText+' · (x + '+f(r)+'x) = '+f(D),[timeText+' · ('+f(r)+'x − x) = '+f(D),timeText+' · (x + '+f(r)+') = '+f(D)],'Время умножь на скорость удаления: получится расстояние между участниками.'),
   value('Приведи подобные и умножь на время. Какой коэффициент перед x?',time*(1+r),'','Вычисли '+timeText+' · (1 + '+f(r)+').',f(time*(1+r))+'x = '+f(D)+'.'),
   solve(slow,'км/ч','Раздели '+f(D)+' на коэффициент '+f(time*(1+r))+'.','x = '+f(slow)+' км/ч — скорость велосипедиста.'),
   value('Найди скорость мотоциклиста.',fast,'км/ч','Вычисли '+f(r)+'x с найденным x.',f(r)+' · '+f(slow)+' = '+f(fast)+' км/ч.'),
   verify('('+f(slow)+' + '+f(fast)+') · '+timeText+' = '+f(D)+'; '+f(fast)+' : '+f(slow)+' = '+f(r),['('+f(fast)+' − '+f(slow)+') · '+timeText+' = '+f(D),f(slow)+' + '+f(fast)+' = '+f(slow+fast+1)])];
  answer=fast;p.title='Скорости: составь уравнение';p.diagram={...p.diagram,v1:'x',v2:f(r)+'x',symbolic:true};
 }else if(p.module==='time'){
  const v=m.v,time=m.t,D=m.s;
  if(t==='path'){steps=[identify('Пройденный путь','км'),model('x = '+f(v)+' · '+f(time),['x = '+f(v)+' − '+f(time),'x = −'+f(v)+' · '+f(time)],'Путь равен скорости, умноженной на время.'),solve(D,'км','Выполни умножение в правой части.', 'x = '+f(D)+' км.'),verify(f(D)+' : '+f(time)+' = '+f(v)+' км/ч',[f(D)+' + '+f(time)+' = '+f(v)+' км/ч'])];}
  if(t==='speed'){steps=[identify('Скорость движения','км/ч'),model(f(time)+'x = '+f(D),['x = −'+f(D)+' : '+f(time),'x + '+f(time)+' = '+f(D)],'За '+f(time)+' ч при скорости x пройдено '+f(time)+'x км.'),solve(v,'км/ч','Раздели обе части на '+f(time)+'.','x = '+f(D)+' : '+f(time)+' = '+f(v)+' км/ч.'),verify(checkRate(v,time,D)+' км',[f(v)+' + '+f(time)+' = '+f(D)+' км'])];}
  if(t==='duration'){steps=[identify('Время движения','ч'),model(f(v)+'x = '+f(D),['x + '+f(v)+' = '+f(D),'x = '+f(D)+' · '+f(v)],'За x часов при скорости '+f(v)+' км/ч пройдено '+f(v)+'x км.'),solve(time,'ч','Раздели обе части на '+f(v)+'.','x = '+f(D)+' : '+f(v)+' = '+f(time)+' ч.'),verify(checkRate(v,time,D)+' км',[f(v)+' − '+f(time)+' = '+f(D)+' км'])];}
 }else if(t==='meeting'){
  const {v1,v2,s:D,t:time}=m,c=v1+v2;
  steps=[identify('Время до встречи','ч',['Скорость первого (км/ч)','Начальное расстояние (км)']),
   choice('Как записать пути до встречи?',f(v1)+'x и '+f(v2)+'x',[f(v1)+' + x и '+f(v2)+' + x',frac(f(v1),'x')+' и '+frac(f(v2),'x')],'У обоих участников одно время x. Путь — скорость умножить на x.', 'До встречи первый проедет '+f(v1)+'x км, второй — '+f(v2)+'x км.'),
   model('('+f(v1)+' + '+f(v2)+')x = '+f(D),['('+f(v1)+' − '+f(v2)+')x = '+f(D),f(v1)+'x = '+f(D)],'Навстречу: сумма двух путей равна начальному расстоянию.'),
   solve(time,'ч','Сначала сложи скорости, затем раздели '+f(D)+' на '+f(c)+'.',f(c)+'x = '+f(D)+'; x = '+f(time)+' ч.'),
   value('Какой путь пройдёт первый?',v1*time,'км','Подставь x в '+f(v1)+'x.',checkRate(v1,time,v1*time)+' км.'),
   verify(f(v1*time)+' + '+f(v2*time)+' = '+f(D)+' км',[f(v1*time)+' − '+f(v2*time)+' = '+f(D)+' км'])];answer=v1*time;
 }else if(t==='catch'||t==='textbook-304'){
  const slow=m.slow,fast=m.fast,D=m.d===undefined?m.gap:m.d,time=D/(fast-slow);
  steps=[identify('Время до догонки','ч',['Начальный промежуток (км)','Скорость заднего (км/ч)']),
   model(f(fast)+'x − '+f(slow)+'x = '+f(D),[f(fast)+'x + '+f(slow)+'x = '+f(D),f(slow)+'x − '+f(fast)+'x = '+f(D)],'За одно время задний должен пройти на начальный промежуток больше, чем передний.'),
   value('Какой коэффициент перед x после приведения подобных?',fast-slow,'','Из скорости заднего вычти скорость переднего.',f(fast-slow)+'x = '+f(D)+'.'),
   solve(time,'ч','Раздели начальный промежуток на коэффициент перед x.','x = '+f(D)+' : '+f(fast-slow)+' = '+f(time)+' ч.'),
   value('Сколько это минут?',time*60,'мин','Умножь x часов на 60.',f(time)+' · 60 = '+f(time*60)+' мин.'),
   verify(f(fast*time)+' − '+f(slow*time)+' = '+f(D)+' км',[f(fast*time)+' + '+f(slow*time)+' = '+f(D)+' км'])];answer=time*60;
 }else if(t==='lag'){
  const {slow,fast,d:D,t:time}=m,result=D+(fast-slow)*time;
  steps=[value('Переведи указанное время в часы.',time,'ч','Число минут раздели на 60.',f(time*60)+' мин = '+f(time)+' ч.'),identify('Расстояние между велосипедистами в конце','км'),
   model('x = '+f(D)+' + ('+f(fast)+' − '+f(slow)+') · '+f(time),['x = '+f(D)+' − ('+f(fast)+' − '+f(slow)+') · '+f(time),'x = ('+f(fast)+' + '+f(slow)+') · '+f(time)],'Передний быстрее. К начальному промежутку прибавляется разность пройденных путей.'),solve(result,'км','Вычисли разность скоростей, умножь на время и прибавь начальный промежуток.','x = '+f(result)+' км.'),verify(f(result)+' − '+f(D)+' = '+f((fast-slow)*time)+' км',[f(result)+' + '+f(D)+' = '+f((fast-slow)*time)+' км'])];
 }else if(t==='river-recover'||t==='river-path-difference'){
  const up=t==='river-recover'?m.up:m.upDistance/m.time,down=t==='river-recover'?m.down:(m.upDistance+m.difference)/m.time,flow=(down-up)/2,own=up+flow;
  if(t==='river-path-difference')steps.push(value('Найди скорость против течения.',up,'км/ч','Путь против течения раздели на время.',f(m.upDistance)+' : '+f(m.time)+' = '+f(up)+' км/ч.'));
  steps.push(identify('Скорость течения','км/ч'),choice('Против течения скорость '+f(up)+'. Как выразить собственную скорость?',f(up)+' + x',[f(up)+' − x',f(up)+'x'],'Чтобы восстановить собственную скорость, прибавь течение.','Собственная скорость — '+f(up)+' + x; по течению — '+f(up)+' + 2x.'),
   model(f(up)+' + 2x = '+f(down),[f(up)+' + x = '+f(down),f(up)+' − 2x = '+f(down)],t==='river-recover'?'По течению к собственной скорости ещё раз прибавляется течение.':'По течению путь '+f(m.upDistance+m.difference)+' км за '+f(m.time)+' ч, значит скорость '+f(down)+' км/ч.'),
   solve(flow,'км/ч','Вычти '+f(up)+' из обеих частей, затем раздели на 2.','2x = '+f(down-up)+'; x = '+f(flow)+' км/ч.'),
   value('Найди собственную скорость катера.',own,'км/ч','Вычисли '+f(up)+' + x.',f(up)+' + '+f(flow)+' = '+f(own)+' км/ч.'),
   verify(f(own)+' + '+f(flow)+' = '+f(down)+'; '+f(own)+' − '+f(flow)+' = '+f(up),[f(own)+' − '+f(flow)+' = '+f(down)]));answer=own;
 }else if(t==='river-speeds'||t==='river-units-down'||t==='river-units-up'){
  const own=m.own,flow=m.flow,down=own+flow,up=own-flow,reverse=t==='river-units-up';
  if(t.startsWith('river-units'))steps.push(value('Переведи '+f(reverse?m.value:m.flowOrMinutes)+' м/мин в км/ч.',reverse?up:flow,'км/ч','Умножь метры в минуту на 60, затем раздели на 1000.',f(reverse?m.value:m.flowOrMinutes)+' · 60 : 1000 = '+f(reverse?up:flow)+' км/ч.'));
  steps.push(identify(reverse?'Собственная скорость катера':'Скорость по течению','км/ч'),model(reverse?'x − '+f(flow)+' = '+f(up):'x − '+f(flow)+' = '+f(own),[reverse?'x + '+f(flow)+' = '+f(up):'x + '+f(flow)+' = '+f(own),'2x = '+f(reverse?up:own)+' − '+f(flow)],reverse?'Собственная скорость минус течение — скорость против течения.':'Из скорости по течению вычти течение: получится собственная скорость.'),
   solve(reverse?own:down,'км/ч','Прибавь '+f(flow)+' к обеим частям.','x = '+f(reverse?own:down)+' км/ч.'));
  if(reverse)steps.push(value('Найди скорость по течению: x + '+f(flow)+'.',down,'км/ч','К найденной собственной скорости прибавь течение.',f(own)+' + '+f(flow)+' = '+f(down)+' км/ч.'));
  if(t==='river-speeds')steps.push(value('Найди скорость против течения.',up,'км/ч','Из собственной скорости вычти течение.',f(own)+' − '+f(flow)+' = '+f(up)+' км/ч.'));
  steps.push(verify(f(down)+' − '+f(flow)+' = '+f(own)+(t==='river-units-down'?'':'; '+f(own)+' − '+f(flow)+' = '+f(up)),[f(own)+' + '+f(flow)+' = '+f(up)]));answer=t==='river-speeds'?up:down;
 }else if(t==='raft'){
  const {flow,t:time}=m,D=flow*time;
  steps=[value('Скорость плота равна скорости течения. Введи её.',flow,'км/ч','У плота нет собственной скорости относительно воды.',f(flow)+' км/ч.'),value('Переведи время в часы.',time,'ч','Число минут раздели на 60.',f(time*60)+' мин = '+f(time)+' ч.'),identify('Путь плота','км'),model('x = '+f(flow)+' · '+f(time),['x = −'+f(flow)+' · '+f(time),'x = '+f(flow*time+1)],'За время t плот проходит путь v · t.'),solve(D,'км','Выполни умножение.', 'x = '+f(D)+' км.'),verify(f(D)+' : '+f(time)+' = '+f(flow)+' км/ч',[f(D)+' : '+f(time)+' = '+f(flow+1)+' км/ч'])];
 }else if(t==='roundtrip'||t==='river-percent'||t==='raft-percent'){
  const {own,flow,down,up,distance:D,td,tu}=m,total=td+tu;
  if(t==='raft-percent'){
   steps.push(identify('Собственная скорость катера','км/ч'),model(f(m.pct/100)+'x = '+f(flow),['x = '+f(flow)+' · '+f(m.pct/100),f(m.pct)+'x = '+f(flow)],'Плот движется со скоростью течения. Эта скорость составляет '+f(m.pct)+'% от собственной скорости x.'),solve(own,'км/ч','Раздели обе части на '+f(m.pct/100)+'.','x = '+f(own)+' км/ч; проверка: '+f(m.pct/100)+' · '+f(own)+' = '+f(flow)+'.'));
  }else{
   if(t==='river-percent')steps.push(value('Найди скорость течения: '+f(m.pct)+'% от '+f(own)+' км/ч.',flow,'км/ч','За 100% принята собственная скорость.',f(own)+' · '+f(m.pct/100)+' = '+f(flow)+' км/ч.'));
   steps.push(identify('Время движения по течению','ч'),model('('+f(own)+' + '+f(flow)+')x = '+f(D),['('+f(own)+' − '+f(flow)+')x = '+f(D),'x = '+f(D)+' · ('+f(own)+' + '+f(flow)+')'],'Скорость по течению умножается на неизвестное время. Получается путь в одну сторону.'),solve(td,'ч','Сначала найди скорость по течению, затем раздели путь на неё.',f(down)+'x = '+f(D)+'; x = '+f(td)+' ч.'));
  }
  if(t==='raft-percent')steps.push(value('Найди время по течению: '+frac(f(D),'x + '+f(flow))+'.',td,'ч','Подставь найденную собственную скорость x.','Скорость по течению '+f(down)+' км/ч; время '+frac(f(D),f(down))+' = '+f(td)+' ч.'));
  steps.push(value(t==='raft-percent'?'Найди время против течения: '+frac(f(D),'x − '+f(flow))+'.':'Обозначим время обратно y. Реши '+f(up)+'y = '+f(D)+'.',tu,'ч','Против течения скорость '+f(own)+' − '+f(flow)+' = '+f(up)+' км/ч. Обратный путь той же длины.',frac(f(D),f(up))+' = '+f(tu)+' ч.'),
   value('Сколько часов занимает весь путь?',total,'ч','Сложи времена двух участков.',f(td)+' + '+f(tu)+' = '+f(total)+' ч.'),
   verify(checkRate(down,td,D)+'; '+checkRate(up,tu,D),['('+f(down)+' + '+f(up)+') : 2 = '+f(total)+' ч']));answer=total;
 }else if(t==='joint-work'){
  const {first,second,together}=m,q1=1/first,qt=1/together,q2=qt-q1;
  steps=[value('Переведи время совместной работы в часы.',together,'ч','Минуты раздели на 60 и прибавь к часам.',f(together)+' ч.'),identify('Производительность второй трубы','бассейна/ч',['Время второй трубы (ч)','Объём всего бассейна']),
   model(frac('1',f(first))+' + x = '+frac('1',f(together)),[f(first)+' + x = '+f(together),frac('1',f(first))+' − x = '+frac('1',f(together))],'Весь бассейн — 1. За час первая труба заполняет '+frac('1',f(first))+', обе вместе — '+frac('1',f(together))+'. Складываются производительности.'),
   solve(q2,'бассейна/ч','Вычти '+frac('1',f(first))+' из обеих частей.', 'x = '+f(qt)+' − '+f(q1)+' = '+f(q2)+' бассейна/ч.'),
   value('За сколько часов вторая труба наполнит бассейн? Вычисли '+frac('1','x')+'.',second,'ч','За час заполняется x бассейна. Весь бассейн 1 раздели на x.',frac('1',f(q2))+' = '+f(second)+' ч.'),
   verify('('+f(q1)+' + '+f(q2)+') · '+f(together)+' = 1 бассейн',[f(first)+' − '+f(together)+' = '+f(second)+' ч'])];answer=second;
 }else if(p.module==='percent-tasks'){
  const type=t==='textbook-361'?'whole':t==='textbook-369-1'||t==='textbook-369-2'?'relation':t,W=m.whole===undefined?m.price:m.whole,P=m.part===undefined?m.discount:m.part,rate=m.pct/100;
  if(t==='textbook-369-2')steps.push(value('Сколько машин грузовые?',P,'машин','Из всех машин вычти легковые.',f(W)+' − '+f(m.passenger)+' = '+f(P)+' машин.'));
  if(type==='whole')steps.push(identify('Вся величина',''+(t==='textbook-361'?'руб.':'карточек')),model(f(rate)+'x = '+f(P),['x = '+f(P)+' · '+f(rate),f(m.pct)+'x = '+f(P)],f(m.pct)+'% от неизвестного целого x равны '+f(P)+'.'),solve(W,t==='textbook-361'?'руб.':'карточек','Раздели обе части на '+f(rate)+'.','x = '+f(P)+' : '+f(rate)+' = '+f(W)+'.'),verify(f(W)+' · '+f(rate)+' = '+f(P),[f(W)+' : '+f(rate)+' = '+f(P)]));
  if(type==='part')steps.push(identify('Число карточек с задачами на движение','карточек'),model(frac('x',f(W))+' = '+f(rate),['x = '+f(W)+' : '+f(rate),frac(f(W),'x')+' = '+f(rate)],'Неизвестная часть x, делённая на всё количество, равна доле '+f(rate)+'.'),solve(P,'карточек','Умножь обе части на '+f(W)+'.','x = '+f(W)+' · '+f(rate)+' = '+f(P)+' карточек.'),verify(f(P)+' : '+f(W)+' · 100 = '+f(m.pct)+'%',[f(W)+' : '+f(P)+' · 100 = '+f(m.pct)+'%']));
  if(type==='relation')steps.push(identify('Процент нужной части','%',['Всё количество (шт.)','Количество в нужной части (шт.)']),model(f(W)+' · '+frac('x','100')+' = '+f(P),[f(W)+' · x = '+f(P),f(P)+' · '+frac('x','100')+' = '+f(W)],'x процентов — это '+frac('x','100')+' от всей величины '+f(W)+'.'),solve(m.pct,'%','Умножь обе части на 100 и раздели на '+f(W)+'.','x = '+f(P)+' · 100 : '+f(W)+' = '+f(m.pct)+'%.'),verify(f(W)+' · '+f(rate)+' = '+f(P),[f(P)+' · '+f(rate)+' = '+f(W)]));
  if(type==='discount')steps.push(identify('Сумма скидки','руб.'),model(frac('x',f(W))+' = '+f(rate),['x = '+f(W)+' : '+f(rate),frac(f(W),'x')+' = '+f(rate)],'Процент скидки берётся от первоначальной цены.',),solve(P,'руб.','Умножь обе части на '+f(W)+'.','x = '+f(W)+' · '+f(rate)+' = '+f(P)+' руб.'),value('Сколько рублей стоит покупка после скидки?',m.pay,'руб.','Из первоначальной цены вычти найденную скидку x.',f(W)+' − '+f(P)+' = '+f(m.pay)+' руб.'),verify(f(m.pay)+' + '+f(P)+' = '+f(W)+'; '+f(P)+' : '+f(W)+' · 100 = '+f(m.pct)+'%',[f(m.pay)+' − '+f(P)+' = '+f(W)]));
  if(type==='discount')answer=m.pay;
 }else throw new Error('Нет решения через неизвестную для '+p.module+'/'+t);
 if(!steps.length||!unknown||!equation||!Number.isFinite(answer))throw new Error('Неполное решение '+p.module+'/'+t);
 // Keep the stored label and choice ordering stable for existing condition keys.
 if(['ratio-meet','textbook-303','ratio-away','textbook-305'].includes(t)){
  const unknownStep=t==='ratio-meet'||t==='textbook-303'?0:1;
  steps[unknownStep].displayLabel='В этом разборе x — меньшая скорость. Чью скорость обозначим буквой x?';
 }
 p.method='equation';p.methodVersion=2;p.steps=steps;p.methodInfo={unknown,unit,equation,answer};
 if(!['ratio-meet','textbook-303','ratio-away','textbook-305'].includes(t))p.title='Решаем через неизвестную';
 return p;
}
root.PetersonEquationMethod={transform,rich,plain,frac,wordModules};
})(typeof window==='undefined'?globalThis:window);
