/* Original early Atanasyan geometry: task-bound construction, no triangle-angle-sum prerequisite. */
(function(root){'use strict';
const D=root.PathData,previous=D.task,variantsPerMode=72,count=216;
const families=[
 ['point-line-ray','Точка, прямая, луч и отрезок','logic','Отрезок ограничен двумя концами; луч имеет начало и продолжается в одну сторону; прямая продолжается в обе стороны.'],
 ['perpendicular','Перпендикулярные прямые','angle','Перпендикулярные прямые пересекаются под прямым углом. Прямой угол равен 90°; знак квадрата показывает это условие.'],
 ['angle-measure','Измеряем угол транспортиром','angle','Совмести центр транспортира с вершиной. Начинай отсчёт от нуля на той стороне, с которой совмещён первый луч.'],
 ['triangle-elements','Стороны, вершины и углы треугольника','logic','Противолежащая сторона не содержит данную вершину. Угол между двумя сторонами расположен у их общего конца.'],
 ['triangle-perimeter','Периметр треугольника','add','Периметр — сумма длин всех трёх сторон. Для неизвестной стороны вычти из периметра сумму двух известных.'],
 ['sas','Первый признак равенства: две стороны и угол','logic','Два треугольника равны, если две стороны и угол между ними одного соответственно равны двум сторонам и углу между ними другого.'],
 ['median','Медиана треугольника','fraction','Медиана соединяет вершину треугольника с серединой противоположной стороны. Равны именно половины стороны; прямой угол не предполагается.'],
 ['bisector','Биссектриса треугольника','fraction','Биссектриса треугольника соединяет вершину с противоположной стороной и делит угол этой вершины пополам. Сторону пополам она обычно не делит.'],
 ['altitude','Высота внутри и вне треугольника','angle','Высота — перпендикуляр из вершины к прямой, содержащей противоположную сторону. В тупоугольном треугольнике основание высоты может лежать на продолжении стороны.'],
 ['isosceles-elements','Равнобедренный треугольник: стороны и основание','logic','В равнобедренном треугольнике две стороны равны. Их называют боковыми; третью сторону — основанием.'],
 ['isosceles-base-angles','Равные углы при основании','angle','Углы при основании равнобедренного треугольника равны. Сначала найди основание по двум данным равным сторонам.'],
 ['isosceles-vertex-line','Три свойства линии из вершины','fraction','В равнобедренном треугольнике биссектриса из вершины между равными сторонами одновременно является медианой и высотой. Для линии из вершины при основании это утверждение не применяется.']
].map(([key,title,gap,idea])=>({id:'grade7-g-core-'+key,title,gap,idea}));
const ids=new Set(families.map(f=>f.id)),S=(q,a,why)=>({q,a:String(a),why,strict:true});
const E=(id,label,description)=>({id,label,description});
function choice(q,labels,correct,n,why){const shift=n%labels.length,order=labels.map((_,i)=>(i+shift)%labels.length);return {...S(q,order.indexOf(correct)+1,why),choices:order.map((v,i)=>({value:String(i+1),label:labels[v]}))};}
const P=(x,y,dx=0,dy=0)=>({x,y,dx,dy}),seg=(id,from,to,extra={})=>({id,from,to,...extra}),ang=(id,vertex,from,to,extra={})=>({id,vertex,from,to,...extra});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function diagram(description,points,segments=[],angles=[]){return {description,points,segments,angles};}
function make(q,answer,steps,params,d,elements,constructions=[]){const last=steps.at(-1);return {q,answer,a:String(answer),answerExact:String(answer),steps,params,strict:true,...(last.choices&&String(last.a)===String(answer)?{choices:last.choices.map(c=>({...c}))}:{}),model:{kind:'grade7-construction',diagram:d,elements,constructions}};}
function triangleWorld(ax=3,ay=9,base=12){return {A:{x:ax,y:ay},B:{x:0,y:0},C:{x:base,y:0}};}
function projected(world){
 const ps=Object.values(world),minX=Math.min(...ps.map(p=>p.x)),maxX=Math.max(...ps.map(p=>p.x)),minY=Math.min(...ps.map(p=>p.y)),maxY=Math.max(...ps.map(p=>p.y)),scale=Math.min(380/(maxX-minX||1),220/(maxY-minY||1)),center=(minX+maxX)/2;
 return Object.fromEntries(Object.entries(world).map(([name,p])=>[name,P(300+(p.x-center)*scale,300-(p.y-minY)*scale,name==='A'?-9:0,name==='A'?-17:26)]));
}
function outsideLabels(d,sideOffset=42){
 for(const s of d.segments){
  if(!s.label)continue;
  const group='ABC'.includes(s.from)?['A','B','C']:['D','E','F'];
  if(!group.every(name=>d.points[name]))continue;
  const p=d.points[s.from],q=d.points[s.to],mx=(p.x+q.x)/2,my=(p.y+q.y)/2,length=Math.hypot(q.x-p.x,q.y-p.y),cx=group.reduce((sum,name)=>sum+d.points[name].x,0)/3,cy=group.reduce((sum,name)=>sum+d.points[name].y,0)/3;
  let nx=-(q.y-p.y)/length,ny=(q.x-p.x)/length;
  if(nx*(cx-mx)+ny*(cy-my)>0){nx=-nx;ny=-ny;}
  const offset=['BC','CB','EF','FE'].includes(s.from+s.to)?54:sideOffset;
  s.labelX=mx+nx*offset;s.labelY=my+ny*offset+6;
 }
 return d;
}
function basicTriangle(world,labels={}){const points=projected(world);return outsideLabels(diagram('Треугольник ABC. Длины и равенства определяются условием, а не измерением рисунка.',points,[seg('AB','A','B',{label:labels.AB||''}),seg('AC','A','C',{label:labels.AC||''}),seg('BC','B','C',{label:labels.BC||''})]));}
function triangleElements(d){return [...Object.keys(d.points).map(name=>E(name,'Точка '+name,'Выдели эту вершину или основание построенного отрезка.')), ...d.segments.filter(s=>!s.construction).map(s=>E(s.id,s.from+s.to,'Сторона соединяет две указанные точки. Проверь, содержит ли она нужную вершину.'))];}
function construction(id,from,to,description){return {id,from,to,label:'Построить '+from+to,description};}
function constructionTriangle(n,shape=0){
 const ax=shape===2?-3:shape===1?0:3+n%3,ay=8+n%4,world=triangleWorld(ax,ay),A=world.A,B=world.B,C=world.C;
 world.M={x:6,y:0};world.H={x:ax,y:0};const ab=distance(A,B),ac=distance(A,C);world.D={x:12*ab/(ab+ac),y:0};
 // At a right vertex the altitude coincides with AB, so H and B are the same point.
 if(shape===1)delete world.H;
 const d=basicTriangle(world),foot=shape===1?'B':'H';
 d.points.M.dy=29;d.points.M.dx=9;d.points.D.dy=62;if(d.points.H){d.points.H.dy=29;d.points.H.dx=-9;}
 if(shape===2)d.segments.push(seg('extension','H','B',{dashed:true}));
 d.segments.push(seg('BM','B','M',{marks:1}),seg('MC','M','C',{marks:1}),seg('median-line','A','M',{construction:'median'}),seg('bisector-line','A','D',{construction:'bisector'}),seg('altitude-line','A',foot,{construction:'altitude'}));
 d.angles.push(ang('right-foot',foot,'A',shape===1?'C':'C',{right:true,construction:'altitude',radius:17}),ang('half-left','A','B','D',{marks:1,construction:'bisector',radius:33}),ang('half-right','A','D','C',{marks:1,construction:'bisector',radius:33}));
 const constructions=[construction('median','A','M','Соедини вершину A с серединой M стороны BC. Штрихи BM и MC отмечают равенство половин.'),construction('bisector','A','D','Отрезок AD делит угол BAC на два равных угла. Равенство отмечено одинаковыми дугами.'),construction('altitude','A',foot,'Отрезок из A перпендикулярен прямой BC. Квадрат у основания отмечает прямой угол.')];
 const elements=[...triangleElements(d),E('median-line','Отрезок AM','Медиана соединяет A с серединой M стороны BC.'),E('bisector-line','Отрезок AD','Биссектриса делит угол A на две равные части.'),E('altitude-line','Перпендикуляр из A','Высота идёт к прямой BC под прямым углом, даже если основание вне стороны.')];
 return {d,world,constructions,elements,foot};
}
function pointLine(n,mode){
 const names=[['A','B'],['M','N'],['K','L'],['P','Q']][n%4],[a,b]=names,tilt=n%3-1,points={[a]:P(170,200+tilt*35,-15,28),[b]:P(425,200-tilt*35,15,28)};
 const dx=points[b].x-points[a].x,dy=points[b].y-points[a].y;let from=a,to=b;
 if(mode>0){points.X=P(points[a].x+dx*1.45,points[a].y+dy*1.45,0,-22);to='X';points.X.label=false;points.X.marker=false;}
 if(mode===2){points.Y=P(points[a].x-dx*.45,points[a].y-dy*.45,0,-22);from='Y';points.Y.label=false;points.Y.marker=false;}
 const type=['отрезок','луч','прямая'][mode],q=mode===0?`Фигура ${a+b} ограничена точками ${a} и ${b}. Как она называется?`:mode===1?`Фигура начинается в ${a}, проходит через ${b} и продолжается за ${b} без конца. Как она называется?`:`Через точки ${a} и ${b} проведена фигура, которая без конца продолжается в обе стороны. Как она называется?`;
 const final=choice('Выбери название фигуры.',['Отрезок','Луч','Прямая'],mode,n,'У отрезка два конца, у луча одно начало, у прямой конечных точек нет.');
 const steps=[S('Сколько конечных граничных точек имеет эта фигура?',[2,1,0][mode],'Считай концы самой фигуры, а не края нарисованной части.'),...(mode===1?[choice('Какая точка является началом луча?',[a,b],0,n,'В названии луча первой пишут его начало.')]:[]),final];
 const d=diagram(`${type[0].toUpperCase()+type.slice(1)} показан только на ограниченном участке экрана. Продолжение прямой или луча задаётся условием.`,points,[seg('figure',from,to)]);
 const elements=[E(a,'Точка '+a,mode===1?'Это начало луча: в противоположную сторону луч не продолжается.':'Проверь, является ли точка концом фигуры по условию.'),E(b,'Точка '+b,'Название точки само по себе не делает её концом бесконечной фигуры.'),E('figure','Вся фигура','Сопоставь число концов с определением фигуры.')];
 return make(q,Number(final.a),steps,{mode,n,type},d,elements);
}
function perpendicular(n,mode){
 const rotation=n%6*5,theta=rotation*Math.PI/180,O=P(300,205,14,23),v={x:Math.cos(theta),y:-Math.sin(theta)},u={x:-v.y,y:v.x};
 const points={O,A:P(O.x-175*v.x,O.y-175*v.y,-8,-15),B:P(O.x+175*v.x,O.y+175*v.y,10,24),C:P(O.x-140*u.x,O.y-140*u.y,10,-18),D:P(O.x+140*u.x,O.y+140*u.y,10,24)};
 const d=diagram('Прямые AB и CD пересекаются в O. Квадрат обозначает известный прямой угол.',points,[seg('AB','A','B'),seg('CD','C','D',{construction:'perpendicular'})],[ang('AOC','O','A','C',{right:true,radius:24,construction:'perpendicular'})]);
 const constructions=[construction('perpendicular','C','D','Проведи через O прямую CD, перпендикулярную AB.')],elements=[E('AB','Прямая AB','Первая прямая проходит через точку O.'),E('CD','Прямая CD','После построения проверь прямой угол между CD и AB.'),E('AOC','Прямой угол AOC','Квадрат обозначает 90°, независимо от наклона прямых на экране.')];
 let q,answer,steps;
 if(mode===0){q='AB ⟂ CD, точка пересечения O. Найди угол BOD.';answer=90;steps=[S('Сколько градусов в прямом угле?',90,'Прямой угол по определению равен 90°.'),S('Найди угол BOD.',90,'Перпендикулярные прямые образуют четыре прямых угла.')];}
 else if(mode===1){const alpha=30+n%31;q=`AB ⟂ CD. Внутри прямого угла AOC проведён луч OE; угол AOE равен ${alpha}°. Найди угол EOC.`;answer=90-alpha;const start=Math.atan2(points.A.y-O.y,points.A.x-O.x),end=Math.atan2(points.C.y-O.y,points.C.x-O.x),delta=Math.atan2(Math.sin(end-start),Math.cos(end-start)),a=start+Math.sign(delta)*alpha*Math.PI/180;points.E=P(O.x+130*Math.cos(a),O.y+130*Math.sin(a),0,-20);d.segments.push(seg('OE','O','E'));d.angles.push(ang('AOE','O','A','E',{label:alpha+'°',radius:50}));steps=[S('Чему равен целый угол AOC?',90,'По условию прямые перпендикулярны.'),S('Найди оставшуюся часть EOC.',answer,`Части AOE и EOC составляют прямой угол: 90° − ${alpha}° = ${answer}°.`)];}
 else{q='Луч OC перпендикулярен прямой AB. OA и OB — противоположные лучи. Найди сумму углов AOC и COB.';answer=180;steps=[S('Найди угол AOC.',90,'Перпендикуляр образует прямой угол с прямой.'),S('Найди угол COB.',90,'Второй угол тоже прямой: он смежен с первым.'),S('Найди сумму этих двух углов.',180,'Два прямых угла составляют развёрнутый угол: 90° + 90° = 180°. Это свойство прямой, а не сумма углов треугольника.')];}
 return make(q,answer,steps,{mode,n},d,elements,constructions);
}
function measuredAngle(n,mode){
 const alpha=mode===0?20+n%65:mode===1?100+n%65:25+n%51,zero=mode===1?180:mode===2?10+n%20:0,end=mode===1?180-alpha:zero+alpha,O=P(300,295,0,28),r=225,at=deg=>P(O.x+r*Math.cos(deg*Math.PI/180),O.y-r*Math.sin(deg*Math.PI/180),0,-17),points={O,A:at(zero),B:at(end)};
 const d=diagram(mode===2?'Лучи OA и OB проходят через две ненулевые отметки одной шкалы. Величина угла равна разности отсчётов.':'Лучи OA и OB образуют указанный угол. Нужная шкала начинается с нуля на стороне OA.',points,[seg('OA','O','A'),seg('OB','O','B',{construction:'second-ray'})],[ang('AOB','O','A','B',{label:'?',radius:54,construction:'second-ray'})]);
 // Tick labels are given readings; never use the unknown angular difference as a label.
 d.protractor={center:'O',radius:170,start:mode===1?180:0,end:mode===1?0:180,readings:[{degrees:zero,label:mode===1?'0°':zero+'°'},{degrees:end,label:mode===1?alpha+'°':end+'°'}]};
 const q=mode===0?`Сторона OA совмещена с отметкой 0° справа. Сторона OB проходит через ${alpha}° на этой же шкале. Найди угол AOB.`:mode===1?`Сторона OA совмещена с нулём слева. Луч OB показывает ${alpha}° по шкале от левого нуля и ${180-alpha}° по обратной шкале. Найди угол AOB.`:`На одной шкале транспортира луч OA проходит через ${zero}°, луч OB — через ${end}°. Найди угол между ними.`;
 const steps=mode===2?[S('Какая отметка соответствует первому лучу?',zero,'Оба показания нужно брать по одной шкале.'),S('Какая отметка соответствует второму лучу?',end,'Определи больший отсчёт на той же шкале.'),S('Найди разность показаний.',alpha,`${end}° − ${zero}° = ${alpha}°. Начальная отметка не была нулём.`)]:[choice('С какого нуля нужно вести отсчёт?',['С нуля справа','С нуля слева'],mode===1?1:0,n,'Начало нужной шкалы лежит на стороне OA.'),S('Чему равен угол AOB?',alpha,mode===1?`Отсчитываем от левого нуля: ${alpha}°. Число ${180-alpha}° относится к другой шкале.`:`Отсчитываем от правого нуля: ${alpha}°.`)];
 return make(q,alpha,steps,{mode,n,alpha,zero,end},d,[E('OA','Первая сторона OA','С ней совмещают нулевую отметку или берут первый отсчёт.'),E('OB','Вторая сторона OB','По ней читают второе показание на той же шкале.')],[construction('second-ray','O','B','Проведи второй луч и сопоставь его со шкалой транспортира.')]);
}
function triangleParts(n,mode){
 const d=basicTriangle(triangleWorld(3+n%5,7+n%4)),target=['A','B','C'][n%3],opposite={A:'BC',B:'AC',C:'AB'}[target];
 const q=mode===0?`В треугольнике ABC укажи сторону, противолежащую вершине ${target}.`:mode===1?`В треугольнике ABC укажи вершину, противолежащую стороне ${opposite}.`:`В треугольнике ABC какой угол расположен между сторонами ${target+opposite[0]} и ${target+opposite[1]}?`;
 const choices=mode===0?['AB','BC','AC']:mode===1?['A','B','C']:['∠A','∠B','∠C'],correct=choices.indexOf(mode===0?opposite:mode===1?target:'∠'+target),final=choice('Выбери ответ.',choices,correct,n,'Противолежащая сторона не содержит вершину. Угол между сторонами находится у их общего конца.');
 return make(q,Number(final.a),[S('Сколько вершин и столько же сторон имеет треугольник?',3,'Три не лежащие на одной прямой точки соединяют тремя отрезками.'),final],{mode,n,target,opposite},d,triangleElements(d));
}
function perimeter(n,mode){
 const ab=5+n%12,ac=ab+1+n%3,bc=4+n%5,total=ab+ac+bc,ax=(ab*ab+bc*bc-ac*ac)/(2*bc),ay=Math.sqrt(ab*ab-ax*ax),world=triangleWorld(ax,ay,bc),d=basicTriangle(world,{AB:mode===1?'?':ab+' см',AC:ac+' см',BC:bc+' см'});let q,answer,steps;
 if(mode===0){q=`AB = ${ab} см, AC = ${ac} см, BC = ${bc} см. Найди периметр ABC.`;answer=total;steps=[S('Сколько сторон нужно включить в периметр?',3,'Периметр — длина всей границы треугольника.'),S('Найди сумму AB и AC.',ab+ac,'Сначала сложи две стороны, не потеряв третью.'),S('Найди периметр.',total,`${ab} + ${ac} + ${bc} = ${total} см.`)];}
 else if(mode===1){q=`Периметр ABC равен ${total} см. AC = ${ac} см, BC = ${bc} см. Найди AB.`;answer=ab;steps=[S('Найди сумму известных сторон.',ac+bc,'Из периметра нужно вычесть обе известные стороны.'),S('Найди AB.',ab,`${total} − (${ac} + ${bc}) = ${ab} см.`)];}
 else{const other=total+2+n%7;q=`AB = ${ab} см, AC = ${ac} см, BC = ${bc} см. Периметр другого треугольника ${other} см. На сколько он больше периметра ABC?`;answer=other-total;steps=[S('Найди периметр ABC.',total,'Сначала вычисли величину, с которой сравнивается другой периметр.'),S('На сколько другой периметр больше?',answer,`${other} − ${total} = ${answer} см. Вопрос «на сколько» требует разности.`)];}
 return make(q,answer,steps,{mode,n,ab,ac,bc,total},d,triangleElements(d));
}
function sas(n,mode){
 const ab=5+n%8,ac=7+Math.floor(n/8),theta=35+n%61,r=theta*Math.PI/180,world={A:{x:0,y:0},B:{x:ab,y:0},C:{x:ac*Math.cos(r),y:ac*Math.sin(r)}};
 const local=projected(world),points={};for(const [name,p] of Object.entries(local)){points[name]=P(25+p.x*.55,75+p.y*.55,p.dx,p.dy);const paired={A:'D',B:'E',C:'F'}[name];points[paired]=P(615-(25+p.x*.55),75+p.y*.55,-p.dx,p.dy);}
 const d=diagram('Соответствующие стороны выделяются попарно. Равенство треугольников обосновываем по условию, а не внешнему сходству.',points,[seg('pair-one','A','B',{marks:1,label:ab+' см'}),seg('pair-one','D','E',{marks:1}),seg('pair-two','A','C',{marks:2,label:ac+' см'}),seg('pair-two','D','F',{marks:2})],[]);
 d.segments.push(seg('BC','B','C',{construction:'complete'}),seg('EF','E','F',{construction:'complete'}));
 const final=mode===0?choice('Какая пара углов нужна для первого признака?',['∠BAC и ∠EDF','∠ABC и ∠DEF','∠BCA и ∠DFE'],0,n,'Между AB и AC находится угол BAC. Между DE и DF — угол EDF. Нужны именно эти углы.'):mode===2?choice('Достаточно ли этих данных для первого признака равенства?',['Нет: данный угол не между указанными сторонами','Да: любые две стороны и любой угол подходят','Да: достаточно внешнего сходства рисунков'],0,n,'Первый признак требует угол между двумя данными сторонами. Угол ABC лежит между BA и BC; сторона BC не входит в данную пару.'):null;
 let q,answer,steps;
 if(mode===0){d.angles.push(ang('included','A','B','C',{radius:28}),ang('included','D','E','F',{radius:28}));q='AB = DE, AC = DF. Выбери углы, равенство которых позволит применить первый признак равенства треугольников.';answer=Number(final.a);steps=[choice('Какая общая вершина у сторон AB и AC?',['A','B','C'],0,n,'Угол между двумя сторонами расположен у их общей вершины.'),final];}
 else if(mode===1){q=`AB = DE = ${ab} см, AC = DF = ${ac} см, ∠BAC = ∠EDF = ${theta}°. По какому признаку равны треугольники ABC и DEF?`;d.angles.push(ang('included','A','B','C',{marks:1,radius:28}),ang('included','D','E','F',{marks:1,radius:28}));const criterion=choice('Выбери достаточное основание для равенства треугольников.',['Две стороны и угол между ними соответственно равны','Достаточно двух сторон без равенства углов','Достаточно одной пары равных сторон'],0,n,'Даны две пары равных сторон и равные углы между ними — первый признак равенства треугольников.');answer=Number(criterion.a);steps=[S('Чему равна сторона DE по данному соответствию?',ab,`AB = DE = ${ab} см.`),choice('Какие углы находятся между указанными сторонами?',['∠BAC и ∠EDF','∠ABC и ∠DEF','∠BCA и ∠DFE'],0,n,'Общие вершины двух данных сторон — A и D.'),criterion];}
 else{q='Даны AB = DE, AC = DF и ∠ABC = ∠DEF. Можно ли по этим данным сразу применить первый признак равенства треугольников?';answer=Number(final.a);d.angles.push(ang('not-included','B','A','C',{marks:1,radius:26}),ang('not-included','E','D','F',{marks:1,radius:26}));steps=[choice('Между какими сторонами расположен угол ABC?',['BA и BC','AB и AC','CA и CB'],0,n,'Средняя буква B — вершина угла; обе его стороны начинаются в B.'),final];}
 outsideLabels(d,52);return make(q,answer,steps,{mode,n,ab,ac,theta},d,[E('pair-one','AB ↔ DE','Первая пара сторон задана равной.'),E('pair-two','AC ↔ DF','Вторая пара сторон задана равной.'),E(mode===2?'not-included':'included',mode===2?'Данный угол не между сторонами':'Угол между сторонами','Проверь общую вершину двух данных сторон. Нельзя заменять угол между ними произвольным углом.')],[construction('complete','B','C','Соедини третьи вершины обоих треугольников и проверь соответствие сторон.')]);
}
function median(n,mode){const b=3+n%30,{d,world,constructions,elements}=constructionTriangle(n),answer=mode===0?b:mode===1?2*b:b;
 d.description='M — середина BC: равенство BM и MC дано штрихами. Другие линии строятся для сравнения определений.';
 const q=mode===0?`AM — медиана ABC. BC = ${2*b} см. Найди BM.`:mode===1?`AM — медиана ABC. BM = ${b} см. Найди BC.`:`AM — медиана ABC. MC = ${b} см. Найди BM.`;
 const steps=[choice('Какую точку стороны BC соединяют с A для медианы?',['Середину M','Основание перпендикуляра H','Точку D, делящую угол A пополам'],0,n,'Медиану определяет середина противоположной стороны, а не прямой угол или равные части угла.'),...(mode===1?[S('Найди MC.',b,'M — середина BC, поэтому MC = BM.')]:[S('На сколько равных частей M делит BC?',2,'BM = MC по определению середины.')]),S(mode===1?'Найди BC.':'Найди BM.',answer,mode===1?`BC = BM + MC = ${b} + ${b} = ${answer} см.`:mode===0?`BM = BC : 2 = ${2*b} : 2 = ${b} см.`:`BM = MC = ${b} см.`)];
 return make(q,answer,steps,{mode,n,b,world},d,elements,constructions);
}
function bisector(n,mode){const half=15+n%46,total=2*half,r=half*Math.PI/180,world={A:{x:0,y:0},B:{x:9*Math.cos(r),y:9*Math.sin(r)},C:{x:14*Math.cos(r),y:-14*Math.sin(r)}};
 const ab=9,ac=14;world.D={x:(ac*world.B.x+ab*world.C.x)/(ab+ac),y:0};world.M={x:(world.B.x+world.C.x)/2,y:(world.B.y+world.C.y)/2};
 const d=basicTriangle(world);d.description='AD делит угол BAC пополам. M — середина BC; на этом неравнобедренном треугольнике M и D различны.';d.points.D.dy=-18;d.points.M.dy=28;d.segments.push(seg('bisector-line','A','D',{construction:'bisector'}),seg('median-line','A','M',{construction:'median'}));d.angles.push(ang('half-left','A','B','D',{marks:1,radius:35,construction:'bisector'}),ang('half-right','A','D','C',{marks:1,radius:35,construction:'bisector'}));
 const answer=mode===1?total:half,q=mode===0?`AD — биссектриса ABC. ∠BAC = ${total}°. Найди ∠BAD.`:mode===1?`AD — биссектриса ABC. ∠BAD = ${half}°. Найди ∠BAC.`:`AD — биссектриса ABC. ∠DAC = ${half}°. Найди ∠BAD.`;
 const steps=[choice('Что делит пополам биссектриса AD?',['Угол BAC','Сторону BC в любом треугольнике','Периметр треугольника'],0,n,'Биссектриса делит угол вершины. Равенство BD и DC без дополнительного условия не следует.'),S(mode===1?'Найди угол DAC.':'Сколько равных частей угла образует биссектриса?',mode===1?half:2,mode===1?'Две части угла равны по определению биссектрисы.':'Биссектриса образует два равных угла.'),S(mode===1?'Найди угол BAC.':'Найди угол BAD.',answer,mode===1?`${half}° + ${half}° = ${total}°.`:mode===0?`${total}° : 2 = ${half}°.`:`∠BAD = ∠DAC = ${half}°.`)];
 return make(q,answer,steps,{mode,n,half,total,world},d,[...triangleElements(d),E('bisector-line','AD','Биссектриса: равны две части угла A.'),E('median-line','AM','Медиана: M — середина стороны. В данном треугольнике это другая линия.')],[construction('bisector','A','D','Построй биссектрису AD и сравни одинаковые дуги.'),construction('median','A','M','Построй для сравнения медиану AM: она идёт к середине стороны.')]);
}
function altitude(n,mode){const {d,world,constructions,elements,foot}=constructionTriangle(n,mode),answer=90;
 d.description=mode===2?'Основание H лежит на продолжении BC за B. Высота проводится к прямой BC, а не обязательно внутрь стороны.':mode===1?'В прямоугольном треугольнике AB перпендикулярна BC. Сторона AB сама является высотой из A.':'Основание H высоты из A лежит внутри стороны BC. Высота перпендикулярна прямой BC.';
 const q=mode===2?'Треугольник ABC тупоугольный; прямая BC продолжена за B до H, AH ⟂ BC. Найди угол AHC.':mode===1?'В треугольнике ABC угол ABC прямой. Какова величина угла между высотой из A и стороной BC?':'В треугольнике ABC AH ⟂ BC, H лежит на BC. Найди угол AHC.';
 const steps=[choice('Какая линия является высотой из A?',[`A${foot}`,'AM','AD'],0,n,'Высоту определяет перпендикулярность прямой противоположной стороны. Медиана и биссектриса имеют другие определения.'),choice('Где находится основание этой высоты?',mode===0?['Внутри стороны BC','Обязательно в середине BC','В вершине A']:mode===1?['В вершине B','В середине BC','За точкой C']:['На продолжении BC за B','Обязательно внутри BC','В середине BC'],0,n,d.description),S('Найди угол между высотой и прямой BC.',90,'Высота является перпендикуляром, поэтому угол равен 90°. Наклон рисунка этого не меняет.')];
 return make(q,answer,steps,{mode,n,world,foot},d,elements,constructions);
}
function isoscelesDiagram(side,base){const height=Math.sqrt(side*side-base*base/4),world=triangleWorld(base/2,height,base),d=basicTriangle(world,{AB:side+' см',AC:side+' см',BC:base+' см'});d.segments[0].marks=d.segments[1].marks=1;return {d,world,height};}
function isoscelesParts(n,mode){const side=7+n%18,base=4+n%9,total=2*side+base,{d,world}=isoscelesDiagram(side,base);let q,answer,steps;
 if(mode===0){q='В треугольнике ABC даны равные стороны AB и AC. Укажи основание.';const final=choice('Какая сторона является основанием?',['BC','AB','AC'],0,n,'Основание — третья сторона. Общая вершина равных боковых сторон находится напротив неё.');answer=Number(final.a);steps=[choice('Какие стороны являются боковыми?',['AB и AC','AB и BC','AC и BC'],0,n,'Боковыми называют данную пару равных сторон.'),final];d.segments.forEach(s=>s.label='');}
 else if(mode===1){q=`ABC равнобедренный, AB = AC. Периметр ${total} см, основание BC = ${base} см. Найди AB.`;answer=side;d.segments[0].label=d.segments[1].label='?';steps=[S('Найди сумму двух боковых сторон.',2*side,`Из периметра вычти основание: ${total} − ${base} = ${2*side}.`),S('На сколько равных частей разделить эту сумму?',2,'AB и AC равны.'),S('Найди AB.',side,`${2*side} : 2 = ${side} см.`)];}
 else{q=`ABC равнобедренный, AB = AC = ${side} см. Периметр ${total} см. Найди BC.`;answer=base;d.segments[2].label='?';steps=[S('Найди сумму боковых сторон.',2*side,'В периметр входят обе равные стороны, поэтому длину умножаем на 2.'),S('Найди основание BC.',base,`${total} − ${2*side} = ${base} см.`)];}
 return make(q,answer,steps,{mode,n,side,base,total,world},d,triangleElements(d));
}
function baseAngles(n,mode){const angle=25+n%56,r=angle*Math.PI/180,world=triangleWorld(6,6*Math.tan(r)),d=basicTriangle(world);d.segments[0].marks=d.segments[1].marks=1;d.angles.push(ang('base-left','B','A','C',{marks:1,radius:33}),ang('base-right','C','B','A',{marks:1,radius:33}));d.description='AB = AC по условию. Основание BC, поэтому углы ABC и BCA равны. Дуги показывают следствие свойства равнобедренного треугольника.';
 const offset=2+n%8,answer=mode===2?angle-offset:angle,q=mode===0?`AB = AC, ∠ABC = ${angle}°. Найди ∠BCA.`:mode===1?`AB = AC, ∠BCA = ${angle}°. Найди ∠ABC.`:`AB = AC, ∠ABC = ${angle}°, ∠BCA = (x + ${offset})°. Найди x.`;
 const steps=[choice('Какая сторона является основанием?',['BC','AB','AC'],0,n,'Равны боковые стороны AB и AC; основание — оставшаяся сторона BC.'),S(mode!==1?'Найди угол BCA.':'Найди угол ABC.',angle,'Углы при основании равнобедренного треугольника равны. Сумма углов треугольника здесь не требуется.'),...(mode===2?[S('Найди x.',answer,`x + ${offset} = ${angle}. Поэтому x = ${angle} − ${offset} = ${answer}.`)]:[])];
 return make(q,answer,steps,{mode,n,angle,offset,world},d,[...triangleElements(d),E('base-left','Угол ABC','Первый угол при основании BC.'),E('base-right','Угол BCA','Второй угол при основании BC, равный первому.')]);
}
function vertexLine(n,mode){const halfAngle=20+n%46,baseHalf=3+n%20,height=baseHalf/Math.tan(halfAngle*Math.PI/180),world=triangleWorld(baseHalf,height,2*baseHalf);world.D={x:baseHalf,y:0};const d=basicTriangle(world);d.segments[0].marks=d.segments[1].marks=1;d.segments.push(seg('vertex-line','A','D',{construction:'vertex-line'}),seg('BD','B','D',{marks:2,construction:'vertex-line'}),seg('DC','D','C',{marks:2,construction:'vertex-line'}));d.angles.push(ang('right','D','A','C',{right:true,radius:19,construction:'vertex-line'}),ang('left-half','A','B','D',{marks:1,radius:31,construction:'vertex-line'}),ang('right-half','A','D','C',{marks:1,radius:31,construction:'vertex-line'}));d.description='AB = AC. Линия AD выходит из вершины A между равными сторонами. Именно эта линия совмещает свойства медианы, биссектрисы и высоты.';
 const answer=mode===0?90:mode===1?baseHalf:halfAngle,q=mode===0?'AB = AC. AD — медиана к основанию BC. Найди угол ADB.':mode===1?`AB = AC. AD — биссектриса угла BAC. BC = ${2*baseHalf} см. Найди BD.`:`AB = AC. AD — высота к основанию BC. ∠BAC = ${2*halfAngle}°. Найди угол BAD.`;
 const steps=[choice('Почему здесь можно объединить три свойства линии AD?',['Она проведена из вершины между равными сторонами к основанию','Любая линия в любом треугольнике имеет все три свойства','Достаточно одного внешнего сходства рисунка'],0,n,'Теорема применяется к линии из вершины A равнобедренного треугольника, противоположной основанию BC.'),S(mode===0?'Чему равен угол между AD и BC?':mode===1?'На сколько равных частей AD делит основание?':'На сколько равных углов AD делит угол A?',mode===0?90:2,mode===0?'Медиана из вершины равнобедренного треугольника является также высотой.':mode===1?'Биссектриса из вершины является также медианой: BD = DC.':'Высота из вершины является также биссектрисой: ∠BAD = ∠DAC.'),S(mode===0?'Найди угол ADB.':mode===1?'Найди BD.':'Найди угол BAD.',answer,mode===0?'AD перпендикулярна BC, поэтому ∠ADB = 90°.':mode===1?`${2*baseHalf} : 2 = ${baseHalf} см.`:`${2*halfAngle}° : 2 = ${halfAngle}°.`)];
 return make(q,answer,steps,{mode,n,halfAngle,baseHalf,world},d,[...triangleElements(d),E('vertex-line','Линия AD','Из вершины между равными сторонами к основанию: высота, медиана и биссектриса совпадают.')],[construction('vertex-line','A','D','Построй AD: появятся обоснованные признаки — равные половины основания, равные углы и прямой угол.')]);
}
const builders=[pointLine,perpendicular,measuredAngle,triangleParts,perimeter,sas,median,bisector,altitude,isoscelesParts,baseAngles,vertexLine];
D.meta.push(...families.map(f=>({...f,pos:null,trainingOnly:true,grade7:true,subject:'geometry',expanded:true,geometryCore:true})));
D.task=function(id,seed=1){if(!ids.has(id))return previous(id,seed);const numeric=Number(seed),k=Number.isFinite(numeric)?((Math.trunc(numeric)%count)+count)%count:0,mode=Math.floor(k/variantsPerMode),n=k%variantsPerMode;return {...builders[families.findIndex(f=>f.id===id)](n,mode),id,seed,pos:null,trainingOnly:true,grade7:true,geometryCore:true,subject:'geometry'};};
D.grade7GeometryCore={families,count,variantsPerMode,modes:3,has:id=>ids.has(id)};
if(typeof module!=='undefined')module.exports=D;
})(typeof window==='undefined'?globalThis:window);
