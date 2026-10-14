/* Original micro-lessons for recovery of grade-7 geometry foundations.
 * Source-page references describe skills, not reproduced workbook exercises. */
(function(root){'use strict';
const H=root.Grade7Rebuild;if(!H)throw new Error('Load grade7-geometry-rebuild-base first');
const {num:N,seg:S,angle:A}=H;
const C=(q,labels,correct,n,why)=>H.choice(q,labels,correct,n,why,labels.map((_,i)=>i===correct?'':'Проверь правило. '+why));
const rad=a=>a*Math.PI/180;
const at=(a,r=5)=>({x:r*Math.cos(rad(a)),y:r*Math.sin(rad(a))});
function orient(world,n){const t=rad((n%8)*45),flip=n%2?-1:1;return Object.fromEntries(Object.entries(world).map(([k,p])=>[k,{x:flip*p.x*Math.cos(t)-p.y*Math.sin(t),y:flip*p.x*Math.sin(t)+p.y*Math.cos(t)}]));}
function D(text,world,segments=[],angles=[],n=0){
 const points=H.project(orient(world,n)),placed=[];
 for(const [k,p] of Object.entries(points)){
  if(k.startsWith('_')){p.label=false;continue;}
  // Keep the true rays, including 1° and 179°; only separate nearby letter labels.
  const candidates=[[p.dx||0,p.dy??-20],[0,-24],[0,28],[-28,0],[28,0],[-28,-25],[28,-25],[-28,28],[28,28],[0,-54],[0,56]];
  const best=candidates.find(([dx,dy])=>placed.every(q=>Math.abs(p.x+dx-q.x)>=27||Math.abs(p.y+dy-q.y)>=27))||candidates.at(-1);
  p.dx=best[0];p.dy=best[1];placed.push({x:p.x+p.dx,y:p.y+p.dy});
 }
 return H.diagram(text,points,segments,angles);
}
function clearPointLabels(d){
 // Leave the geometry and given values fixed. Move only a point's letter when
 // a short side or a narrow angle brings it too close to a numerical label.
 const box=(x,y,text)=>({x:x-Math.max(22,String(text).length*13)/2,y:y-23,w:Math.max(22,String(text).length*13),h:30});
 const touches=(a,b)=>Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>-3&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>-3;
 const occupied=[];
 for(const s of d.segments){if(!s.label)continue;const a=d.points[s.from],b=d.points[s.to],length=Math.hypot(b.x-a.x,b.y-a.y);occupied.push(box(s.labelX??((a.x+b.x)/2-(b.y-a.y)/length*22),s.labelY??((a.y+b.y)/2+(b.x-a.x)/length*22),s.label));}
 for(const a of d.angles){if(!a.label)continue;const v=d.points[a.vertex],p=d.points[a.from],q=d.points[a.to],start=Math.atan2(p.y-v.y,p.x-v.x),end=Math.atan2(q.y-v.y,q.x-v.x),delta=((end-start+Math.PI*3)%(2*Math.PI))-Math.PI,r=Math.min(a.radius||32,Math.hypot(p.x-v.x,p.y-v.y)*.45,Math.hypot(q.x-v.x,q.y-v.y)*.45)+Math.max(1,a.marks||1)*5+20;occupied.push(box(a.labelX??(v.x+r*Math.cos(start+delta/2)),a.labelY??(v.y+r*Math.sin(start+delta/2)+6),a.label));}
 const letters=Object.entries(d.points).filter(([,p])=>p.label!==false);
 for(const [name,p] of letters){
  const current=box(p.x+(p.dx||0),p.y+(p.dy??-15),p.label??name);
  if(!occupied.some(b=>touches(current,b)))continue;
  const others=letters.filter(([,q])=>q!==p).map(([id,q])=>box(q.x+(q.dx||0),q.y+(q.dy??-15),q.label??id));
  const candidates=[[0,-28],[0,34],[-32,0],[32,0],[-32,-28],[32,-28],[-32,34],[32,34],[0,-48],[0,50],[-50,0],[50,0]];
  const best=candidates.find(([dx,dy])=>{const candidate=box(p.x+dx,p.y+dy,p.label??name);return [...occupied,...others].every(b=>!touches(candidate,b));});
  if(best){p.dx=best[0];p.dy=best[1];}
 }
 return d;
}
function lesson(q,steps,diagram,params={}){return H.make({q,steps,diagram:clearPointLabels(diagram),params});}
function reg(key,title,section,pages,idea,prerequisites,build){H.register({key,title,section,sourcePages:pages,idea,prerequisites,build});}
function lineD(n,points,segs,text){
 const d=D(text,points,segs,[],n);
 for(const s of d.segments){if(!s.label)continue;const a=d.points[s.from],b=d.points[s.to],length=Math.hypot(b.x-a.x,b.y-a.y);s.labelX=(a.x+b.x)/2-(b.y-a.y)/length*50;s.labelY=(a.y+b.y)/2+(b.x-a.x)/length*50+5;}
 return d;
}
function rays(n,angles,extra={}){const world={O:{x:0,y:0}},segs=[];for(const [name,deg] of Object.entries(angles)){world[name]=at(deg);world['_'+name]=at(deg,6);segs.push(S('O'+name,'O','_'+name,{elementLabel:'Луч O'+name,description:'Луч O'+name+' начинается в O и продолжается за '+name+'.'}));}return D(extra.description||'Лучи имеют общее начало O. Они продолжаются за подписанные точки; длина рисунка не ограничивает луч.',world,segs,extra.arcs||[],n);}
function crossing(n,theta=55,arcs=[]){return rays(n,{A:0,B:180,C:theta,D:theta+180},{description:'Прямые AB и CD пересекаются в O. OA и OB — противоположные лучи; OC и OD — противоположные лучи.',arcs});}
function triangle(n,lengths,labels={}){const [ab,bc,ca]=lengths,x=(ab*ab+ca*ca-bc*bc)/(2*ab),height=Math.sqrt(ca*ca-x*x),world={A:{x:0,y:0},B:{x:ab,y:0},C:{x,y:height}},d=D('Треугольник ABC. Числа берём из условия и подписей, а не измеряем на экране.',world,[S('AB','A','B',{label:labels.AB||''}),S('BC','B','C',{label:labels.BC||''}),S('CA','C','A',{label:labels.CA||''})],[],n);
 const center={x:(d.points.A.x+d.points.B.x+d.points.C.x)/3,y:(d.points.A.y+d.points.B.y+d.points.C.y)/3};
 for(const s of d.segments){const p=d.points[s.from],q=d.points[s.to],dx=q.x-p.x,dy=q.y-p.y,L=Math.hypot(dx,dy),mx=(p.x+q.x)/2,my=(p.y+q.y)/2;let ux=-dy/L,uy=dx/L;if(ux*(center.x-mx)+uy*(center.y-my)>0){ux=-ux;uy=-uy;}s.labelX=mx+ux*35;s.labelY=my+uy*35+5;}
 return d;
}

reg('point-membership','Точка на прямой и на отрезке',1,[5,10],'Точка за концом отрезка может лежать на его прямой. Отрезок включает оба своих конца.',[],n=>{
 const mode=n%4,b=5+n%5,x=[b/2,b+2,b,-2][mode],world={A:{x:0,y:0},B:{x:b,y:0},M:{x,y:mode===3?2:0},_L:{x:-4,y:0},_R:{x:b+4,y:0}},onLine=mode!==3,onSegment=mode===0||mode===2;
 if(mode===2){delete world.M;}const target=mode===2?'B':'M',position=['между A и B','на продолжении за B','является концом AB','вне прямой AB'][mode];
 return lesson(`A и B — различные точки. Точка ${target} ${position}. Принадлежит ли ${target} отрезку AB?`,[C(`Принадлежит ли ${target} прямой AB?`,['Да','Нет'],onLine?0:1,n,onLine?'Прямая продолжается без конца в обе стороны.':'Точка вне прямой не принадлежит и отрезку на этой прямой.'),C(`Принадлежит ли ${target} отрезку AB?`,['Да','Нет'],onSegment?0:1,n+1,onSegment?'Отрезок содержит свои концы и все точки между ними.':'Точки за концами или вне прямой не принадлежат отрезку AB.')],lineD(n,world,[S('line','_L','_R',{dashed:true,elementLabel:'Прямая AB',description:'Прямая AB продолжается за оба конца выделенного отрезка.'}),S('AB','A','B')],'Пунктиром показано продолжение прямой AB; сплошной участок — отрезок AB.'),{mode,b,x,onLine,onSegment,target});
});
reg('segment-names','Концы и названия отрезка',1,[5,7],'Порядок концов отрезка можно поменять. У прямой нет концов, у луча одно начало.',['point-membership'],n=>{
 const [a,b,c]=[['A','B','C'],['M','N','P'],['K','L','T']][n%3],mode=Math.floor(n/3)%3,world={[a]:{x:0,y:0},[b]:{x:7,y:0},[c]:{x:3,y:0}};
 const final=C(`Как ещё назвать отрезок ${a+b}?`,[b+a,a+c,c+b],0,n,'Название отрезка задают два его конца. Внутренняя точка не заменяет конец.');
 const lead=C(['Сколько концов имеет отрезок?','Сколько конечных граничных точек имеет прямая?','Сколько начал имеет луч?'][mode],['0','1','2'],[2,0,1][mode],n+1,['Отрезок ограничен двумя концами.','Прямая бесконечна в обе стороны; край картинки не её конец.','У луча одно начало и одно направление продолжения.'][mode]);
 return lesson(`Точки ${a}, ${c}, ${b} различны и лежат в этом порядке на одной прямой. Как ещё назвать отрезок ${a+b}?`,[lead,C(`Какие точки — концы отрезка ${a+b}?`,[`${a} и ${b}`,`${a} и ${c}`,`${c} и ${b}`],0,n+2,'Две буквы в названии — концы выбранного отрезка.'),final],lineD(n,world,[S(a+b,a,b)],'Показан целый отрезок с одной внутренней точкой.'),{mode,a,b,c});
});
reg('segment-count','Все отрезки на рисунке',1,[7,10],'Два различных отмеченных конца задают один отрезок; обратное имя не создаёт нового отрезка.',['segment-names'],n=>{
 const count=3+n%3,names='ABCDE'.slice(0,count).split(''),world=Object.fromEntries(names.map((k,i)=>[k,{x:i*(2+n%2),y:0}])),pairs=[];for(let i=0;i<count;i++)for(let j=i+1;j<count;j++)pairs.push(names[i]+names[j]);
 return lesson(`На одном отрезке отмечены ${count} различные точки ${names.join(', ')}. Сколько всего отрезков с концами в этих точках изображено?`,[N(`Сколько отрезков начинается в ${names[0]} и заканчивается в другой отмеченной точке?`,count-1,'Зафиксируй первый конец и по очереди выбери каждый из остальных.'),C('Нужно ли считать AB и BA как два разных отрезка?',['Нет, это один отрезок','Да, порядок букв создаёт новый отрезок'],0,n,'У этих названий одинаковые концы.'),N('Сколько различных отрезков всего?',pairs.length,`Перечислим без повторов: ${pairs.join(', ')}.`)],lineD(n,world,[S('whole',names[0],names.at(-1))],'Все отмеченные точки лежат на одном отрезке. Учитываются также отрезки, проходящие через промежуточные точки.'),{count,names,pairs});
});
reg('ray-start','Начало и направление луча',2,[11,14],'Первая буква в имени луча — начало; вторая показывает направление.',['segment-names'],n=>{
 const names=[['A','B'],['M','N'],['K','P']][n%3],reverse=Math.floor(n/3)%2,[a,b]=reverse?[...names].reverse():names,world={[a]:{x:0,y:0},[b]:{x:4,y:0},_end:{x:7,y:0}};
 return lesson(`Луч ${a+b} начинается в одной из данных точек и проходит через другую. Какая точка является его началом?`,[C('Где продолжается этот луч без конца?',[`За ${b} в направлении от ${a} к ${b}`,`За ${a} в направлении от ${b} к ${a}`],0,n,'Луч читают от первой буквы ко второй.'),C(`Назови начало луча ${a+b}.`,[a,b],0,n+1,'Начало записывается первой буквой.')],lineD(n,world,[S('ray',a,'_end',{elementLabel:'Луч '+a+b,description:'Луч '+a+b+' начинается в '+a+' и проходит через '+b+'.'})],`Луч ${a+b} продолжается за ${b}.`),{a,b});
});
reg('ray-same','Разные названия одного луча',2,[11,13],'Одно начало и одно направление могут иметь несколько названий.',['ray-start'],n=>{
 const side=n%2,world={O:{x:0,y:0},A:{x:2,y:0},B:{x:5,y:0},C:{x:-4,y:0},_L:{x:-6,y:0},_R:{x:7,y:0}},target=side?'OC':'OA';
 return lesson(`Точки C, O, A, B лежат на одной прямой именно в таком порядке. Какой из лучей ${side?'OA, OB, CO':'OB, OC, AO'} совпадает с ${target}?${side?' Если никакой, выбери соответствующий ответ.':''}`,[C('У каких двух лучей одно начало O и одно направление?',['OA и OB','OA и OC','OA и AO'],0,n,'A и B расположены по одну сторону от O, а C — по другую.'),C(`Какой луч из списка совпадает с ${target}?`,side?['Никакой из OA, OB, CO','OA','CO']:['OB','OC','AO'],0,n+1,side?'OA и OB направлены противоположно OC, а CO начинается в C.':'OA и OB имеют общее начало O и направлены в одну сторону.')],lineD(n,world,[S('line','_L','_R',{elementLabel:'Прямая AB',description:'На прямой лежат точки C, O, A, B в указанном порядке.'})],'На прямой отмечены точки в порядке C, O, A, B.'),{side});
});
reg('angle-vertex','Вершина и стороны угла',2,[11,14],'Вершина находится в середине трёхбуквенного названия. Обе стороны угла — лучи из этой вершины.',['ray-start'],n=>{
 const names=[['A','O','B'],['K','M','P'],['D','E','F']][n%3],[a,o,b]=names,deg=35+n%110,world={[o]:{x:0,y:0},[a]:at(0),[b]:at(deg)};
 return lesson(`Назови стороны угла ${a+o+b}.`,[C(`Какая точка — вершина угла ${a+o+b}?`,[o,a,b],0,n,'Вершина — средняя буква названия.'),C('Какие два луча образуют этот угол?',[`${o+a} и ${o+b}`,`${a+o} и ${b+o}`,`${a+b} и ${b+a}`],0,n+1,'Оба луча начинаются в вершине угла.')],D(`Угол ${a+o+b}; стороны продолжаются в показанных направлениях.`,world,[S(o+a,o,a),S(o+b,o,b)],[A('angle',o,a,b)],n),{a,o,b,deg});
});
reg('angle-count','Считаем неразвёрнутые углы',2,[13,14],'Каждая пара различных лучей задаёт угол; развёрнутые исключаем, если так требует вопрос.',['ray-same','angle-vertex'],n=>{
 const mode=n%3,degs=mode===0?{A:0,B:35+n%20,C:110+n%30}:mode===1?{A:0,B:45+n%50,C:180}:{A:0,B:180,C:40+n%40,D:220+n%40},k=Object.keys(degs).length,straight=mode===0?0:mode===1?1:2,total=k*(k-1)/2;
 return lesson(`Из O выходят ${k} различных луча. ${mode===0?'Ни одна пара не является противоположной.':mode===1?'OA и OC — противоположные лучи.':'OA и OB, OC и OD — пары противоположных лучей.'} Сколько неразвёрнутых углов они образуют?`,[N('Сколько разных пар лучей можно выбрать?',total,k===3?'Пары: первая со второй, первая с третьей, вторая с третьей — всего 3.':'С каждым лучом соединяем остальные, не повторяя пару в обратном порядке: 3 + 2 + 1 = 6.'),N('Сколько из этих углов развёрнутые?',straight,'Каждая пара противоположных лучей даёт ровно один развёрнутый угол.'),N('Сколько остаётся неразвёрнутых углов?',total-straight,`${total} − ${straight} = ${total-straight}. Угол и его обратное трёхбуквенное имя не считаем дважды.`)],rays(n,degs),{mode,degs,k,straight});
});

reg('segment-part','Целый отрезок и его части',3,[15,17],'Если B между A и C, то AB + BC = AC.',['point-membership'],n=>{
 const ab=3+n%17,bc=4+Math.floor(n/2)%19,mode=n%3,total=ab+bc,ask=['AC','BC','AB'][mode],q=mode===0?`B лежит между A и C. AB = ${ab} см, BC = ${bc} см. Найди AC.`:mode===1?`B лежит между A и C. AC = ${total} см, AB = ${ab} см. Найди BC.`:`B лежит между A и C. AC = ${total} см, BC = ${bc} см. Найди AB.`;
 return lesson(q,[C('Какой отрезок состоит из двух остальных?',['AC','AB','BC'],0,n,'B лежит внутри AC; AB и BC — соседние части.'),C(`Как найти ${ask}?`,mode===0?['AB + BC','AB − BC','AB × BC']:mode===1?['AC − AB','AC + AB','AB − AC']:['AC − BC','AC + BC','BC − AC'],0,n+1,mode===0?'Для целого складываем части.':'Для неизвестной части вычитаем известную часть из целого.'),N(`Найди ${ask}, в сантиметрах.`,[total,bc,ab][mode],mode===0?`${ab} + ${bc} = ${total}.`:mode===1?`${total} − ${ab} = ${bc}.`:`${total} − ${bc} = ${ab}.`)],lineD(n,{A:{x:0,y:0},B:{x:ab,y:0},C:{x:total,y:0}},[S('AB','A','B',{label:mode===2?'?':`${ab} см`}),S('BC','B','C',{label:mode===1?'?':`${bc} см`})],'B находится между A и C. Длина целого дана в условии, если она известна.'),{ab,bc,total,mode});
});
reg('midpoint','Середина отрезка',3,[15,17],'Середина принадлежит отрезку и делит его на две равные части.',['segment-part'],n=>{
 const half=3+n%30,mode=n%3,answer=mode===1?2*half:half,q=mode===0?`M — середина AB, AB = ${2*half} см. Найди AM.`:mode===1?`M — середина AB, AM = ${half} см. Найди AB.`:`M — середина AB, MB = ${half} см. Найди AM.`;
 return lesson(q,[C('Какое равенство следует из того, что M — середина AB?',['AM = MB','AM = AB','MB = AB'],0,n,'Середина делит именно целый отрезок AB на две равные половины.'),N(mode===1?'Найди весь отрезок AB.':'Найди AM.',answer,mode===1?`${half} + ${half} = ${answer} см.`:mode===0?`${2*half} : 2 = ${half} см.`:`AM = MB = ${half} см.`)],lineD(n,{A:{x:0,y:0},M:{x:half,y:0},B:{x:2*half,y:0}},[S('AM','A','M',{marks:1,label:mode===1?`${half} см`:'?'}),S('MB','M','B',{marks:1,label:mode===2?`${half} см`:''})],'M — середина AB; одинаковые штрихи обозначают данное равенство AM и MB.'),{half,mode});
});
reg('equal-parts','Несколько равных частей',3,[16,17],'Одинаковые штрихи задают равные длины. Сначала считаем части, потом вычисляем.',['midpoint'],n=>{
 const count=3+n%2,unit=2+n%19,mode=Math.floor(n/2)%3,names='ABCDE'.slice(0,count+1).split(''),world=Object.fromEntries(names.map((k,i)=>[k,{x:i*unit,y:0}])),segments=names.slice(1).map((k,i)=>S(names[i]+k,names[i],k,{marks:1,label:mode===0&&i===0?`${unit} см`:''})),whole=names[0]+names.at(-1),answer=mode===0?count*unit:mode===1?unit:2*unit;
 const q=mode===0?`Отрезок ${whole} состоит из ${count} равных частей. Первая часть равна ${unit} см. Найди ${whole}.`:`Отрезок ${whole} длиной ${count*unit} см разделён на ${count} равных частей. Найди ${mode===1?names[0]+names[1]:names[0]+names[2]}.`;
 return lesson(q,[N('Сколько равных частей составляет весь отрезок?',count,'Посчитай интервалы между соседними точками, а не точки.'),N('Чему равна одна часть?',unit,mode===0?'Длина одной части дана.':`${count*unit} : ${count} = ${unit} см.`),N('Найди длину запрошенного отрезка.',answer,mode===0?`${count} × ${unit} = ${answer} см.`:mode===1?'Нужна одна из равных частей.':`Нужны две части: ${unit} + ${unit} = ${answer} см.`)],lineD(n,world,segments,'Каждая соседняя часть помечена одним штрихом; все эти части равны.'),{count,unit,mode,names});
});
reg('angle-parts','Угол и его части',3,[18,20],'Внутренний луч делит угол на две части: целый угол равен их сумме.',['angle-vertex','segment-part'],n=>{
 const alpha=18+n%48,beta=23+Math.floor(n/2)%42,total=alpha+beta,mode=n%3,ask=['AOC','BOC','AOB'][mode],q=mode===0?`OB проходит внутри угла AOC. ∠AOB = ${alpha}°, ∠BOC = ${beta}°. Найди ∠AOC.`:mode===1?`OB проходит внутри угла AOC. ∠AOC = ${total}°, ∠AOB = ${alpha}°. Найди ∠BOC.`:`OB проходит внутри угла AOC. ∠AOC = ${total}°, ∠BOC = ${beta}°. Найди ∠AOB.`;
 return lesson(q,[C('Как записать целый угол через его части?',['∠AOC = ∠AOB + ∠BOC','∠AOB = ∠AOC + ∠BOC','∠AOC = ∠AOB − ∠BOC'],0,n,'Луч OB внутренний, поэтому два меньших угла без наложения составляют AOC.'),N(`Найди ∠${ask}.`,[total,beta,alpha][mode],mode===0?`${alpha}° + ${beta}° = ${total}°.`:mode===1?`${total}° − ${alpha}° = ${beta}°.`:`${total}° − ${beta}° = ${alpha}°.`)],rays(n,{A:0,B:alpha,C:total},{arcs:[A('part1','O','A','B',{label:mode===2?'?':`${alpha}°`,radius:35}),A('part2','O','B','C',{label:mode===1?'?':`${beta}°`,radius:65})]}),{alpha,beta,total,mode});
});
reg('angle-bisector','Биссектриса делит угол пополам',3,[18,20],'Биссектриса — внутренний луч, делящий угол на два равных угла.',['angle-parts'],n=>{
 const half=15+n%65,mode=n%3,q=mode===0?`OM — биссектриса угла AOB, ∠AOB = ${2*half}°. Найди ∠AOM.`:mode===1?`OM — биссектриса угла AOB, ∠AOM = ${half}°. Найди ∠AOB.`:`OM — биссектриса угла AOB, ∠MOB = ${half}°. Найди ∠AOM.`,answer=mode===1?2*half:half;
 return lesson(q,[C('Что дано о частях угла?',['∠AOM = ∠MOB','OA = OB','OM делит любой отрезок пополам'],0,n,'Биссектриса делит угол, а равенство длин сторон угла из этого не следует.'),N(mode===1?'Найди ∠AOB.':'Найди ∠AOM.',answer,mode===1?`${half}° + ${half}° = ${answer}°.`:mode===0?`${2*half}° : 2 = ${half}°.`:`∠AOM = ∠MOB = ${half}°.`)],rays(n,{A:0,M:half,B:2*half},{arcs:[A('half1','O','A','M',{marks:1,radius:42,label:mode===1?`${half}°`:''}),A('half2','O','M','B',{marks:1,radius:42,label:mode===2?`${half}°`:''})]}),{half,mode});
});
reg('angle-type','Острый, прямой, тупой угол',3,[18,20],'Сравни градусную меру с 90° и 180°. Границы проверяются отдельно.',['angle-vertex'],n=>{
 const choices=['Острый','Прямой','Тупой','Развёрнутый'],deg=[1,89,90,91,179,180,25+n%60,100+n%75][n%8],index=deg<90?0:deg===90?1:deg<180?2:3;
 return lesson(`Угол AOB равен ${deg}°. К какому виду он относится?`,[C(`Как ${deg}° соотносится с 90°?`,['Меньше 90°','Равно 90°','Больше 90°'],deg<90?0:deg===90?1:2,n,'Сравни именно числа градусов; поворот рисунка не меняет величину угла.'),C('Назови вид угла.',choices,index,n+1,'Острый: меньше 90°; прямой: 90°; тупой: больше 90°, но меньше 180°; развёрнутый: 180°.')],rays(n,{A:0,B:deg},{arcs:[A('given','O','A','B',{label:deg+'°',radius:45})]}),{deg});
});
reg('angle-protractor','Транспортир: выбери начало отсчёта',3,[18,20],'Отсчёт начинают от нуля на стороне угла; два ненулевых отсчёта одной шкалы вычитают.',['angle-type'],n=>{
 const mode=n%3,alpha=25+Math.floor(n/3)*2,zero=mode===1?180:mode===2?15+n%11:0,end=mode===1?180-alpha:zero+alpha,O=H.point(300,300,0,30),point=deg=>H.point(300+210*Math.cos(rad(deg)),300-210*Math.sin(rad(deg)),0,-18),d=H.diagram('Схематический транспортир: отмечены нужные деления одной шкалы. Рисунок служит для чтения отсчётов.',{O,A:point(zero),B:point(end)},[S('OA','O','A'),S('OB','O','B')],[A('unknown','O','A','B',{label:'?',radius:45})],{protractor:{center:'O',radius:160,readings:[{degrees:zero,label:mode===1?'0°':zero+'°'},{degrees:end,label:mode===1?alpha+'°':end+'°'}]}}),q=mode===0?`OA совмещён с нулём справа. OB проходит через ${alpha}° по шкале от этого нуля. Найди ∠AOB.`:mode===1?`OA совмещён с нулём слева. Для OB шкала слева показывает ${alpha}°, а обратная шкала ${180-alpha}°. Найди ∠AOB.`:`OA и OB проходят через ${zero}° и ${end}° одной шкалы транспортира. Найди угол между ними.`;
 return lesson(q,[mode===2?N('Какой меньший отсчёт нужно вычесть?',zero,'Два показания берём с одной шкалы.'):C('Откуда нужно начать отсчёт?',['От нуля справа','От нуля слева'],mode===1?1:0,n,'Выбираем ноль, совпадающий со стороной OA.'),N('Найди ∠AOB.',alpha,mode===2?`${end}° − ${zero}° = ${alpha}°.`:`По выбранной шкале угол равен ${alpha}°.`)],d,{mode,alpha,zero,end});
});

reg('adjacent-identify','Когда углы смежные',4,[21,25],'Общая сторона обязательна, а две другие стороны должны быть противоположными лучами.',['angle-vertex','ray-same'],n=>{
 const yes=n%2===0,degs=yes?{A:0,B:40+n%50,C:180}:{A:0,B:30+n%30,C:110+n%40};
 return lesson(`Углы AOB и BOC имеют общую сторону OB. ${yes?'OA и OC — противоположные лучи.':'OA и OC не лежат на одной прямой.'} Смежные ли эти углы?`,[C('Какая сторона общая у двух углов?',['OB','OA','OC'],0,n,'В названиях AOB и BOC луч OB встречается в обоих углах.'),C('Смежные ли AOB и BOC?',['Да','Нет'],yes?0:1,n+1,yes?'Есть общая сторона OB, а OA и OC противоположны.':'Общей стороны недостаточно: две другие стороны не являются противоположными лучами.')],rays(n,degs),{yes,degs});
});
reg('adjacent-calc','Сумма смежных углов',4,[21,23],'Сумма смежных углов равна 180°.',['adjacent-identify'],n=>{
 const given=[1,89,90,91,179][n%12]||20+n%141,reverse=n%2,known=reverse?'BOC':'AOB',unknown=reverse?'AOB':'BOC',a=reverse?180-given:given;
 return lesson(`A, O, C лежат на одной прямой, O между A и C. ∠${known} = ${given}°. Найди смежный с ним ∠${unknown}.`,[N('Чему равна сумма этих смежных углов?',180,'Их внешние стороны — противоположные лучи, образующие развёрнутый угол.'),N(`Найди ∠${unknown}.`,180-given,`180° − ${given}° = ${180-given}°.`)],rays(n,{A:0,B:a,C:180},{arcs:[A('given','O',reverse?'B':'A',reverse?'C':'B',{label:given+'°',radius:32})]}),{given,reverse});
});
reg('vertical-identify','Когда углы вертикальные',4,[21,25],'Для вертикальных углов стороны одного попарно противоположны сторонам другого.',['adjacent-identify'],n=>{
 const yes=n%2===0,second=yes?'BOD':'COB',theta=35+n%90;
 return lesson(`Прямые AB и CD пересекаются в O. Являются ли углы AOC и ${second} вертикальными?`,[C('Какой луч противоположен OA?',['OB','OC','OD'],0,n,'A и B лежат по разные стороны O на одной прямой.'),C(`Вертикальные ли углы AOC и ${second}?`,['Да','Нет'],yes?0:1,n+1,yes?'OA противоположен OB, OC противоположен OD: обе пары сторон подходят.':'Углы имеют общую сторону OC, поэтому это смежная, а не вертикальная пара.')],crossing(n,theta),{yes,theta});
});
reg('vertical-calc','Вертикальные и смежные углы',4,[22,26],'Вертикальный угол равен данному; смежный дополняет его до 180°.',['vertical-identify','adjacent-calc'],n=>{
 const given=25+n%125,mode=n%2,ask=mode?'BOC':'BOD';
 return lesson(`Прямые AB и CD пересекаются в O, ∠AOC = ${given}°. Найди ∠${ask}.`,[C('Какой угол вертикален углу AOC?',['BOD','BOC','AOD'],0,n,'Для BOD обе стороны противоположны сторонам AOC.'),N('Найди ∠BOD.',given,'Вертикальные углы равны.'),...(mode?[N('Найди ∠BOC.',180-given,`∠BOC смежен с ∠AOC: 180° − ${given}° = ${180-given}°.`)]:[])],crossing(n,given,[A('given','O','A','C',{label:given+'°',radius:45})]),{given,mode});
});
reg('adjacent-equation','Смежные углы: отношение и разность',4,[23,24],'Обозначь меньший угол x. Для «в k раз» запиши kx, для «на d°» — x + d.',['adjacent-calc'],n=>{
 const mode=n%2,ratio=[2,3,4,5,8][Math.floor(n/2)%5],difference=15+Math.floor(n/2)*3,small=mode?(180-difference)/2:180/(1+ratio),large=180-small,askLarge=Math.floor(n/4)%2===1,q=mode?`Два угла смежные. Один больше другого на ${difference}°. Найди ${askLarge?'больший':'меньший'} угол.`:`Два угла смежные. Больший угол в ${ratio} ${ratio<5?'раза':'раз'} больше меньшего. Найди ${askLarge?'больший':'меньший'} угол.`;
 const steps=[C('Меньший угол равен x. Как выразить больший?',mode?[`x + ${difference}`,`${difference}x`,`x − ${difference}`]:[`${ratio}x`,`x + ${ratio}`,`x : ${ratio}`],0,n,mode?'«На» задаёт прибавление разности.':'«В несколько раз» задаёт умножение.'),C('Какое уравнение выражает сумму смежных углов?',mode?[`x + (x + ${difference}) = 180`,`x + (x + ${difference}) = 90`,`x + ${difference} = 180`]:[`x + ${ratio}x = 180`,`x + ${ratio}x = 90`,`${ratio}x = 180`],0,n+1,'Сумма двух смежных углов равна 180°.'),N('Найди меньший угол x.',small,mode?`2x = 180 − ${difference}; x = ${small}°.`:`${ratio+1}x = 180; x = ${small}°.`),...(askLarge?[N('Найди больший угол.',large,`180° − ${small}° = ${large}°.`)]:[])];
 return lesson(q,steps,rays(n,{A:0,B:small,C:180},{arcs:[A('smaller','O','A','B',{label:'x',radius:40}),A('larger','O','B','C',{label:mode?`x + ${difference}`:`${ratio}x`,radius:70})]}),{mode,ratio,difference,small,large,askLarge});
});
reg('perpendicular','Перпендикулярные прямые',4,[21,26],'Перпендикулярные прямые образуют четыре прямых угла независимо от наклона рисунка.',['adjacent-calc','vertical-identify'],n=>{
 const mode=n%3,part=18+n%55,degs={A:0,B:180,C:90,D:270},d=crossing(n,90,[A('right','O','A','C',{right:true,marks:1,radius:24})]);let q,steps;
 if(mode===0){q='AB ⟂ CD, O — точка пересечения. Найди ∠BOD.';steps=[N('Чему равен прямой угол AOC?',90,'Знак перпендикулярности задаёт прямой угол.'),N('Найди ∠BOD.',90,'BOD вертикален AOC, поэтому тоже равен 90°.')];}
 else if(mode===1){q=`AB ⟂ CD. Луч OE внутри AOC, ∠AOE = ${part}°. Найди ∠EOC.`;const extra=rays(n,{...degs,E:part},{arcs:[A('right','O','A','C',{right:true,marks:1,radius:24}),A('known','O','A','E',{label:part+'°',radius:60})]});Object.assign(d,extra);steps=[N('Чему равен весь угол AOC?',90,'AOC — угол между перпендикулярными прямыми.'),N('Найди оставшуюся часть EOC.',90-part,`90° − ${part}° = ${90-part}°.`)];}
 else{q='AB ⟂ CD. Сколько прямых углов образовали эти две прямые в точке O?';steps=[N('Сколько градусов в одном таком угле?',90,'Прямые перпендикулярны, значит угол прямой.'),N('Сколько прямых углов образовалось?',4,'Вертикальный угол равен 90°, каждый смежный — 180° − 90° = 90°: всего четыре.')];}
 return lesson(q,steps,d,{mode,part});
});

reg('triangle-elements','Вершины, стороны и углы треугольника',5,[27,28],'Противолежащая сторона не содержит выбранную вершину; угол между сторонами находится у их общего конца.',['angle-vertex'],n=>{
 const vertex='ABC'[n%3],other='ABC'.split('').filter(k=>k!==vertex),opposite=other.join(''),mode=Math.floor(n/3)%3,sideNames=['AB','AC','BC'],q=mode===0?`Какая сторона треугольника ABC лежит напротив вершины ${vertex}?`:mode===1?`Какая вершина треугольника ABC лежит напротив стороны ${opposite}?`:`Назови вершину угла между сторонами ${vertex+other[0]} и ${vertex+other[1]}.`,final=mode===0?C('Назови противолежащую сторону.',sideNames,sideNames.indexOf(opposite),n,'Противолежащая сторона соединяет две другие вершины.'):C(mode===1?'Назови противолежащую вершину.':'Назови вершину угла между сторонами.',['A','B','C'],'ABC'.indexOf(vertex),n,'Против стороны — третья вершина; между двумя сторонами — их общий конец.');
 return lesson(q,[C(`Какие две стороны выходят из ${vertex}?`,[`${vertex+other[0]} и ${vertex+other[1]}`,`${opposite} и ${vertex+other[0]}`,`${opposite} и ${vertex+other[1]}`],0,n+1,'Обе стороны у вершины содержат её букву.'),final],triangle(n,[7+n%4,8+n%3,9+n%5]),{vertex,other,opposite,mode});
});
reg('triangle-correspondence','Соответственные элементы равных треугольников',5,[29,32],'Равенство треугольников уже дано. Порядок букв указывает соответствие вершин, а затем сторон и углов.',['triangle-elements'],n=>{
 const perm=['DEF','DFE','EDF','EFD','FDE','FED'][n%6],map={A:perm[0],B:perm[1],C:perm[2]},mode=Math.floor(n/6)%3,value=mode===1?35+n%65:6+n%21,apex=mode===1?at(value,3):{x:1,y:3},world={A:{x:0,y:0},B:{x:4,y:0},C:apex,[map.A]:{x:10,y:1},[map.B]:{x:6,y:1},[map.C]:{x:10-apex.x,y:1+apex.y}},segs=[S('AB','A','B'),S('BC','B','C'),S('CA','C','A'),S('DE',map.A,map.B),S('EF',map.B,map.C),S('FD',map.C,map.A)],target=mode===0?map.A+map.B:mode===1?map.B+map.A+map.C:map.B+map.C,given=mode===0?'AB':mode===1?'BAC':'BC',unit=mode===1?'°':' см',vertex=mode===2?'B':'A';
 const q=`Дано: ΔABC = Δ${perm}. ${mode===1?'∠':''}${given} = ${value}${unit}. Найди ${mode===1?'∠':''}${target}.`;
 return lesson(q,[C(`Какая вершина второго треугольника соответствует ${vertex}?`,perm.split(''),perm.indexOf(map[vertex]),n,'Сопоставь первую букву с первой, вторую со второй, третью с третьей.'),C(`Какой элемент соответствует ${mode===1?'∠':''}${given}?`,mode===1?[`∠${target}`,`∠${map.A+map.B+map.C}`,`∠${map.A+map.C+map.B}`]:[target,mode===0?map.A+map.C:map.A+map.B,mode===0?map.B+map.C:map.A+map.C],0,n+1,'Заменяй каждую вершину её парой, сохраняя порядок; вершина угла должна остаться посередине.'),N(`Найди ${mode===1?'∠':''}${target}.`,value,'Уже известно, что треугольники равны, поэтому соответствующие элементы равны.')],D('Два равных треугольника изображены с отражением. Соответствие задано порядком букв в условии, а не положением на экране.',world,segs,[],n),{perm,map,mode,value,target,given});
});
reg('perimeter-sum','Периметр и неизвестная сторона',5,[27,32],'Периметр — сумма трёх сторон. Для неизвестной стороны вычти две известные из периметра.',['triangle-elements','segment-part'],n=>{
 const sides=[8+n%10,9+Math.floor(n/3)%7,10+Math.floor(n/2)%8],total=sides.reduce((a,b)=>a+b,0),mode=n%2,q=mode===0?`AB = ${sides[0]} см, BC = ${sides[1]} см, CA = ${sides[2]} см. Найди периметр ABC.`:`Периметр ABC равен ${total} см, AB = ${sides[0]} см, BC = ${sides[1]} см. Найди CA.`,labels={AB:sides[0]+' см',BC:sides[1]+' см',CA:mode?'?':sides[2]+' см'};
 return lesson(q,[N('Найди сумму AB и BC.',sides[0]+sides[1],'Сложи две известные стороны.'),N(mode?'Найди CA.':'Найди периметр ABC.',mode?sides[2]:total,mode?`${total} − (${sides[0]} + ${sides[1]}) = ${sides[2]} см.`:`${sides.join(' + ')} = ${total} см.`)],triangle(n,sides,labels),{sides,total,mode});
});
reg('perimeter-chain-more-half','Периметр: больше на и меньше вдвое',5,[27,32],'Сначала восстанови каждую сторону по условию, затем сложи три стороны.',['perimeter-sum'],n=>{
 const half=8+n%19,first=half+2+n%Math.max(2,half-3),second=2*half,difference=second-first,sides=[first,second,half],total=first+second+half;
 return lesson(`В треугольнике AB = ${first} см. BC на ${difference} см больше AB, а CA в 2 раза меньше BC. Найди периметр.`,[C('Как получить BC из AB?',[`Прибавить ${difference}`,`Умножить на ${difference}`,`Вычесть ${difference}`],0,n,'«На несколько сантиметров больше» означает прибавить разность.'),N('Найди BC.',second,`${first} + ${difference} = ${second} см.`),C('Как получить CA из BC?',['Разделить BC на 2','Вычесть 2 из BC','Умножить BC на 2'],0,n+1,'«В 2 раза меньше» означает деление на 2.'),N('Найди CA.',half,`${second} : 2 = ${half} см.`),N('Найди периметр.',total,`${first} + ${second} + ${half} = ${total} см.`)],triangle(n,sides,{AB:first+' см',BC:'?',CA:'?'}),{sides,first,difference,total});
});
reg('perimeter-chain-less-double','Периметр: меньше на и больше вдвое',5,[27,32],'Вычитание «на» и умножение «в» — разные действия. Сохраняй, с какой стороной идёт сравнение.',['perimeter-chain-more-half'],n=>{
 const second=7+n%20,difference=2+n%Math.max(2,second-2),first=second+difference,third=2*second,sides=[first,second,third],total=first+second+third;
 return lesson(`В треугольнике AB = ${first} см. BC на ${difference} см меньше AB, а CA в 2 раза больше BC. Найди периметр.`,[C('Как найти BC?',[`AB − ${difference}`,`AB : ${difference}`,`AB + ${difference}`],0,n,'Сравнение «на … меньше» требует вычитания.'),N('Найди BC.',second,`${first} − ${difference} = ${second} см.`),C('С какой стороной сравнивается CA в условии?',['С BC','С AB','С периметром'],0,n+1,'CA вдвое больше именно BC, а не первой стороны.'),N('Найди CA.',third,`${second} × 2 = ${third} см.`),N('Найди периметр.',total,`${first} + ${second} + ${third} = ${total} см.`)],triangle(n,sides,{AB:first+' см',BC:'?',CA:'?'}),{sides,first,difference,total});
});
function perimeterEquation(n,k){
 const x=6+n%18,difference=(k===4?2:1)*x+1+n%Math.max(1,x-2),sides=k===4?[x,x+difference,4*x]:[x,3*x,x+difference],total=sides.reduce((a,b)=>a+b,0),sumCoefficient=k===4?6:5,compareSide=k===4?'BC':'CA',multipleSide=k===4?'CA':'BC',q=`Периметр треугольника ABC равен ${total} см. ${compareSide} на ${difference} см больше AB, а ${multipleSide} в ${k} раза больше AB. Найди длину AB.`,expression=k===4?`x + (x + ${difference}) + 4x = ${total}`:`x + 3x + (x + ${difference}) = ${total}`;
 return lesson(q,[C(`Пусть AB = x. Как выразить ${compareSide}?`,[`x + ${difference}`,`${difference}x`,`x − ${difference}`],0,n,'Увеличение на заданную длину выражаем сложением.'),C(`Как выразить ${multipleSide}?`,[`${k}x`,`x + ${k}`,`x : ${k}`],0,n+1,'Увеличение в несколько раз выражаем умножением.'),C('Какое уравнение задаёт периметр?',[expression,`x + ${difference} + ${k} = ${total}`,`${sumCoefficient}x = ${total}`],0,n+2,'В периметр включаем все три стороны: постоянную разность тоже нужно сохранить.'),N('Сколько всего долей x содержат три стороны?',sumCoefficient,`1 + 1 + ${k} = ${sumCoefficient}.`),N(`Вычти ${difference} из периметра.`,total-difference,`${total} − ${difference} = ${total-difference}. Осталась сумма одинаковых долей.`),N('Найди длину AB.',x,`${total-difference} : ${sumCoefficient} = ${x} см. Проверка сторон: ${sides.join(' + ')} = ${total} см.`)],triangle(n,sides,{AB:'x',BC:k===4?`x + ${difference}`:'3x',CA:k===4?'4x':`x + ${difference}`}),{k,x,difference,sides,total,sumCoefficient});
}
reg('perimeter-equation-fourfold','Периметр: уравнение с четырьмя долями',5,[27,32],'Обозначь первую сторону x, запиши две другие и сложи все три выражения.',['perimeter-chain-more-half'],n=>perimeterEquation(n,4));
reg('perimeter-equation-threefold','Периметр: уравнение с тремя долями',5,[27,32],'Проверяй, какая сторона больше на указанную величину, а какая — в несколько раз.',['perimeter-equation-fourfold'],n=>perimeterEquation(n,3));
})(typeof window==='undefined'?globalThis:window);
