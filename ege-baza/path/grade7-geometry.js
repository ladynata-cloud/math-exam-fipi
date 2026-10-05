/* Original grade-seven geometry. Existing families and seed meanings are unchanged. */
(function(root){'use strict';
const D=root.PathData, previous=D.task, F=D.F, count=240;
const families=[
 {id:'grade7-g-segment-order',title:'Отрезки: целое и части',idea:'Сначала установи порядок точек. Складывай только части без наложения; неизвестную часть найди вычитанием из целого.',gap:'add'},
 {id:'grade7-g-midpoint-chain',title:'Середина отрезка и половины',idea:'Середина делит отрезок на две равные части. Если пополам делят ещё одну половину, получаются четверти исходного отрезка.',gap:'fraction'},
 {id:'grade7-g-angle-naming',title:'Название угла и его вершина',idea:'В названии угла из трёх букв вершина стоит посередине. Назови стороны угла, прежде чем складывать или вычитать его части.',gap:'logic'},
 {id:'grade7-g-angle-addition',title:'Сложение и вычитание углов',idea:'Луч внутри угла делит его на части без наложения. Целый угол равен сумме этих частей.',gap:'add'},
 {id:'grade7-g-angle-bisector',title:'Биссектриса: две равные части',idea:'Биссектриса — луч из вершины, который делит угол на два равных угла. Равные дуги отмечают именно известное равенство.',gap:'fraction'},
 {id:'grade7-g-adjacent-equation',title:'Смежные углы и уравнение',idea:'У смежных углов одна сторона общая, две другие — противоположные лучи. Их сумма равна 180°. Сначала составь равенство.',gap:'equations'},
 {id:'grade7-g-vertical-chain',title:'Вертикальные и смежные углы',idea:'Вертикальные углы равны. Смежные составляют развёрнутый угол. Каждый раз называй пару, к которой применяешь свойство.',gap:'equations'},
 {id:'grade7-g-triangle-correspondence',title:'Равные треугольники: соответствие',idea:'Если равенство треугольников дано, порядок букв задаёт соответствие вершин. Переносить длину можно только на соответствующую сторону.',gap:'logic'}
];
const ids=new Set(families.map(x=>x.id));
const S=(q,a,why)=>({q,a,why,strict:true});
function choice(q,labels,index,why){return {...S(q,index+1,why),choices:labels.map((label,i)=>({value:String(i+1),label}))};}
const P=(x,y,dx=0,dy=0)=>({x,y,dx,dy});
function segmentDiagram(points,segments,description){
 const names=Object.keys(points),max=Math.max(...Object.values(points));
 return {type:'segments',description,points:Object.fromEntries(names.map(name=>[name,P(60+points[name]/max*480,155,0,30)])),segments,angles:[]};
}
const segment=(id,from,to,label,lane=0,marks=0)=>({id,from,to,label,lane,marks});
function angleDiagram(vertex,rays,angles,description,cross=false){
 const center=cross?[300,170]:[285,260],radius=cross?126:205;
 const points={[vertex]:P(...center,-16,26)};
 for(const [name,degrees] of Object.entries(rays)){
  const a=degrees*Math.PI/180;
  points[name]=P(center[0]+radius*Math.cos(a),center[1]-radius*Math.sin(a),Math.cos(a)*18,-Math.sin(a)*18+5);
 }
 return {type:'angles',description,points,segments:Object.keys(rays).map(name=>segment('ray-'+name,vertex,name,'',0)),angles:angles.map((a,i)=>({...a,radius:a.radius||42+i*24}))};
}
const angle=(id,vertex,from,to,degrees,label,marks=0)=>({id,vertex,from,to,degrees,label,marks});
const element=(id,label,description)=>({id,label,description});
function build(id,seed){
 const k=((Math.trunc(Number(seed)||0)%count)+count)%count,variant=k%3,n=Math.floor(k/3);
 let q,answer,steps,diagram,elements,params;
 if(id==='grade7-g-segment-order'){
  const a=4+n%13,b=6+Math.floor(n/3)%11,c=3+Math.floor(n/7)%9;
  if(variant===0){
   q=`Точки A, B, C лежат на одной прямой в указанном порядке. AB = ${a} см, BC = ${b} см. Найди AC в сантиметрах.`;answer=a+b;
   steps=[choice('Какая точка лежит между двумя другими?',['A','B','C'],1,'В порядке A — B — C точка B находится между A и C.'),S('На сколько неперекрывающихся частей точка B делит AC?',2,'Части AB и BC имеют только общий конец B.'),S('Чему равен AC в сантиметрах?',answer,`AC = AB + BC = ${a} + ${b} = ${answer} см.`)];
   diagram=segmentDiagram({A:0,B:a,C:a+b},[segment('AB','A','B',`${a} см`),segment('BC','B','C',`${b} см`),segment('AC','A','C','?',1)],'A — B — C; B между A и C.');
  }else if(variant===1){
   q=`Точка B лежит между A и C. AC = ${a+b} см, AB = ${a} см. Найди BC в сантиметрах.`;answer=b;
   steps=[choice('Какой отрезок является целым?',['AB','BC','AC'],2,'Точка B разделяет целый отрезок AC на AB и BC.'),S('Какую известную длину нужно вычесть из AC?',a,`Из целого AC вычитаем AB = ${a} см.`),S('Чему равен BC в сантиметрах?',answer,`BC = AC − AB = ${a+b} − ${a} = ${answer} см.`)];
   diagram=segmentDiagram({A:0,B:a,C:a+b},[segment('AB','A','B',`${a} см`),segment('BC','B','C','?'),segment('AC','A','C',`${a+b} см`,1)],'A — B — C; B между A и C.');
  }else{
   q=`Точки A, B, C, D лежат на прямой в указанном порядке. AB = ${a} см, BC = ${b} см, AD = ${a+b+c} см. Найди CD в сантиметрах.`;answer=c;
   steps=[S('Чему равен AC в сантиметрах?',a+b,`AC состоит из AB и BC: ${a} + ${b} = ${a+b} см.`),choice('Какое равенство описывает целый отрезок AD?',['AD = AC + CD','AD = AC − CD','AD = AB + CD'],0,'В порядке A — B — C — D отрезок AD состоит из AC и CD.'),S('Чему равен CD в сантиметрах?',answer,`CD = AD − AC = ${a+b+c} − ${a+b} = ${answer} см.`)];
   diagram=segmentDiagram({A:0,B:a,C:a+b,D:a+b+c},[segment('AB','A','B',`${a} см`),segment('BC','B','C',`${b} см`),segment('CD','C','D','?'),segment('AD','A','D',`${a+b+c} см`,1)],'A — B — C — D; части отрезка не накладываются.');
  }
  params={a,b,c};elements=diagram.segments.map(s=>element(s.id,s.from+s.to,`Выделен отрезок ${s.from+s.to}${s.label?': '+s.label:''}.`));
 }else if(id==='grade7-g-midpoint-chain'){
  const u=3+n%27;
  if(variant===0){
   q=`M — середина отрезка AB. AM = ${u} см. Найди AB в сантиметрах.`;answer=2*u;
   steps=[S('На сколько равных частей середина M делит AB?',2,'По определению середины AM = MB.'),S('Чему равен MB в сантиметрах?',u,`MB = AM = ${u} см.`),S('Чему равен AB в сантиметрах?',answer,`AB = AM + MB = ${u} + ${u} = ${answer} см.`)];
   diagram=segmentDiagram({A:0,M:u,B:2*u},[segment('AM','A','M',`${u} см`,0,1),segment('MB','M','B','?',0,1),segment('AB','A','B','?',1)],'A — M — B; AM = MB, поскольку M — середина AB.');
  }else if(variant===1){
   q=`M — середина AB, N — середина AM. AB = ${4*u} см. Найди AN в сантиметрах.`;answer=u;
   steps=[S('Чему равен AM в сантиметрах?',2*u,`AM = AB : 2 = ${4*u} : 2 = ${2*u} см.`),S('На сколько равных частей N делит AM?',2,'По условию N — середина AM, поэтому AN = NM.'),S('Чему равен AN в сантиметрах?',answer,`AN = AM : 2 = ${2*u} : 2 = ${u} см.`)];
   diagram=segmentDiagram({A:0,N:u,M:2*u,B:4*u},[segment('AN','A','N','?',0,2),segment('NM','N','M','',0,2),segment('MB','M','B','',0,1),segment('AM','A','M','',1,1),segment('AB','A','B',`${4*u} см`,2)],'A — N — M — B; AM = MB, AN = NM.');
  }else{
   q=`M — середина AB, N — середина MB. AN = ${3*u} см. Найди AB в сантиметрах.`;answer=4*u;
   steps=[S('Если MN — одна равная доля, сколько таких долей содержит MB?',2,'N — середина MB: MN = NB. Значит, MB содержит две доли.'),S('Сколько таких долей содержит AN = AM + MN?',3,'AM = MB — две доли. Ещё MN — одна доля. Вместе три доли.'),S('Чему равна одна доля MN в сантиметрах?',u,`Три доли составляют ${3*u} см, одна равна ${3*u} : 3 = ${u} см.`),S('Чему равен AB в сантиметрах?',answer,`AB содержит четыре доли: ${u} · 4 = ${answer} см.`)];
   diagram=segmentDiagram({A:0,M:2*u,N:3*u,B:4*u},[segment('AM','A','M','',0,1),segment('MN','M','N','',0,2),segment('NB','N','B','',0,2),segment('MB','M','B','',1,1),segment('AN','A','N',`${3*u} см`,2)],'A — M — N — B; AM = MB, MN = NB.');
  }
  params={u};elements=diagram.segments.map(s=>element(s.id,s.from+s.to,`Отрезок ${s.from+s.to}. Одинаковые штрихи обозначают равные отрезки.`));
 }else if(id==='grade7-g-angle-naming'){
  const a=25+n%26,b=35+Math.floor(n/2)%31,total=a+b;
  const labels=variant===0?['B','A','C','D']:variant===1?['O','A','B','C']:['M','K','L','N'];
  const [v,l,m,r]=labels,small=l+v+m,other=m+v+r,big=l+v+r;
  answer=variant===0?total:variant===1?a:b;
  q=variant===0?`Луч ${v+m} проходит внутри угла ${big}. ∠${small} = ${a}°, ∠${other} = ${b}°. Найди ∠${big}.`:variant===1?`Луч ${v+m} проходит внутри угла ${big}. ∠${big} = ${total}°, ∠${other} = ${b}°. Найди ∠${small}.`:`Луч ML проходит внутри угла KMN. ∠KML = ${a}°, ∠LMN = ${b}°. Найди ∠NML.`;
  steps=variant===2?[choice('Какая буква обозначает вершину угла NML?',['N','M','L'],1,'В трёхбуквенном названии NML вершина M находится посередине.'),choice('Какое название обозначает тот же угол, что и LMN?',['NML','MNL','LNM'],0,'Крайние буквы можно переставить: LMN и NML — один угол между лучами ML и MN. Вершина M остаётся посередине.'),S('Найди ∠NML в градусах.',b,`∠NML = ∠LMN = ${b}°. Стороны и вершина те же; складывать или вычитать углы здесь не нужно.`)]:[choice(`Назови вершину угла ${big}.`,[l,v,r],1,`Средняя буква ${v} — вершина. Его стороны — лучи ${v+l} и ${v+r}.`),choice(`Как записать угол между лучами ${v+l} и ${v+m}?`,[v+l+m,l+m+v,small],2,`Вершина ${v} стоит посередине: ∠${small}. Обратная запись ∠${m+v+l} обозначает тот же угол.`),S(`Найди ∠${variant===0?big:small} в градусах.`,answer,variant===0?`∠${big} = ∠${small} + ∠${other} = ${a}° + ${b}° = ${total}°.`:`∠${small} = ∠${big} − ∠${other} = ${total}° − ${b}° = ${a}°.`)];
  diagram=angleDiagram(v,{[l]:0,[m]:a,[r]:total},[angle('small',v,l,m,a,variant===1?'?':`${a}°`,1),angle('other',v,m,r,b,`${b}°`,2),{...angle('whole',v,l,r,total,variant===0?'?':variant===1?`${total}°`:'',0),radius:128}],`Вершина ${v}; луч ${v+m} лежит внутри угла ${big}.`);
  params={a,b,total,vertex:v,left:l,middle:m,right:r};elements=[element('small','∠'+small,`Стороны — лучи ${v+l} и ${v+m}, вершина — ${v}.`),element('other','∠'+other,`Стороны — лучи ${v+m} и ${v+r}, вершина — ${v}.`),element('whole','∠'+big,`Угол между крайними лучами ${v+l} и ${v+r}.`)];
 }else if(id==='grade7-g-angle-addition'){
  const a=25+n%26,b=35+Math.floor(n/2)%21,c=15+Math.floor(n/4)%16,total=a+b+(variant===2?c:0);
  if(variant===0){
   q=`Луч OB лежит внутри угла AOC. ∠AOB = ${a}°, ∠BOC = ${b}°. Найди ∠AOC.`;answer=total;
   steps=[choice('Какое равенство верно?',['∠AOC = ∠AOB + ∠BOC','∠AOB = ∠AOC + ∠BOC','∠AOC = ∠AOB − ∠BOC'],0,'Луч OB расположен внутри угла, поэтому две части без наложения составляют целый угол AOC.'),S('Найди ∠AOC в градусах.',answer,`∠AOC = ${a}° + ${b}° = ${answer}°.`)];
  }else if(variant===1){
   q=`Луч OB лежит внутри угла AOC. ∠AOC = ${total}°, ∠AOB = ${a}°. Найди ∠BOC.`;answer=b;
   steps=[S('Какой угол в градусах является целым?',total,'Целый угол AOC образован крайними лучами OA и OC.'),S('Найди ∠BOC в градусах.',answer,`∠BOC = ∠AOC − ∠AOB = ${total}° − ${a}° = ${answer}°.`)];
  }else{
   q=`Внутри угла AOD лучи идут в порядке OA, OB, OC, OD. ∠AOD = ${total}°, ∠AOB = ${a}°, ∠BOC = ${b}°. Найди ∠COD.`;answer=c;
   steps=[S('Чему равен угол AOC в градусах?',a+b,`∠AOC = ∠AOB + ∠BOC = ${a}° + ${b}° = ${a+b}°.`),S('Найди ∠COD в градусах.',answer,`∠COD = ∠AOD − ∠AOC = ${total}° − ${a+b}° = ${answer}°.`)];
  }
  const angles=[angle('AOB','O','A','B',a,`${a}°`,1),angle('BOC','O','B','C',b,variant===1?'?':`${b}°`,2)];
  if(variant===2)angles.push(angle('COD','O','C','D',c,'?',3));
  angles.push({...angle('whole','O','A',variant===2?'D':'C',total,variant===0?'?':`${total}°`,0),radius:128});
  diagram=angleDiagram('O',{A:0,B:a,C:a+b,...(variant===2?{D:total}:{})},angles,'Лучи внутри целого угла идут в указанном порядке. Разные дуги различают углы; равенство из рисунка не предполагается.');
  params={a,b,c,total};elements=angles.map(x=>element(x.id,'∠'+x.from+'O'+x.to,x.id==='whole'?'Целый угол между крайними лучами.':'Часть целого угла между соседними лучами.'));
 }else if(id==='grade7-g-angle-bisector'){
  const u=25+n%15,total=variant===2?4*u:2*u;
  if(variant===0){
   q=`OB — биссектриса угла AOC. ∠AOC = ${total}°. Найди ∠AOB.`;answer=u;
   steps=[S('На сколько равных частей биссектриса OB делит AOC?',2,'По определению биссектрисы ∠AOB = ∠BOC.'),S('Найди ∠AOB в градусах.',answer,`∠AOB = ∠AOC : 2 = ${total}° : 2 = ${u}°.`)];
  }else if(variant===1){
   q=`OB — биссектриса угла AOC. ∠AOB = ${u}°. Найди ∠AOC.`;answer=total;
   steps=[S('Найди ∠BOC в градусах.',u,`Биссектриса делит угол поровну: ∠BOC = ∠AOB = ${u}°.`),S('Найди ∠AOC в градусах.',answer,`∠AOC = ${u}° + ${u}° = ${total}°.`)];
  }else{
   q=`OC — биссектриса угла AOB; OD — биссектриса угла COB. ∠AOB = ${total}°. Найди ∠COD.`;answer=u;
   steps=[S('Найди ∠COB в градусах.',2*u,`OC делит AOB пополам: ${total}° : 2 = ${2*u}°.`),S('На сколько равных частей OD делит угол COB?',2,'OD — биссектриса именно угла COB, а не всего AOB.'),S('Найди ∠COD в градусах.',answer,`∠COD = ∠COB : 2 = ${2*u}° : 2 = ${u}°.`)];
  }
  const rays=variant===2?{A:0,C:2*u,D:3*u,B:4*u}:{A:0,B:u,C:2*u};
  const angles=variant===2?[angle('AOC','O','A','C',2*u,'',1),angle('COB','O','C','B',2*u,'',1),angle('COD','O','C','D',u,'?',2),angle('DOB','O','D','B',u,'',2)]:[angle('AOB','O','A','B',u,variant===1?`${u}°`:'?',1),angle('BOC','O','B','C',u,'',1)];
  angles.push({...angle('whole','O','A',variant===2?'B':'C',total,variant===1?'?':`${total}°`,0),radius:136});
  diagram=angleDiagram('O',rays,angles,'Одинаковое число дуг отмечает равные углы по условию о биссектрисе.');
  params={u,total};elements=angles.map(x=>element(x.id,'∠'+x.from+'O'+x.to,x.id==='whole'?'Исходный целый угол.':'Сверь число дуг: одинаковые отметки здесь следуют из условия о биссектрисе.'));
 }else if(id==='grade7-g-adjacent-equation'){
  const d=20+2*(n%31),mult=2+n%4,shift=5+n%16;
  const x=variant===0?(180-d)/2:180/(mult+1),a=variant===0?x:variant===1?mult*x:mult*x-shift,b=180-a;
  const left=variant===0?'x':variant===1?`${mult}x`:`(${mult}x − ${shift})`,right=variant===0?`(x + ${d})`:variant===1?'x':`(x + ${shift})`;
  q=`Лучи OA и OB — противоположные. ∠AOC = ${left}°, ∠COB = ${right}°. Найди x.`;answer=x;
  const coefficient=variant===0?2:mult+1,remainder=variant===0?180-d:180;
  steps=[S('Чему равна сумма смежных углов в градусах?',180,'Общая сторона — OC; OA и OB — противоположные лучи. Поэтому ∠AOC + ∠COB = 180°.'),S('После приведения подобных какой коэффициент будет при x?',coefficient,variant===0?`x + x + ${d} = 180, значит, 2x + ${d} = 180.`:variant===1?`${mult}x + x = 180, значит, ${coefficient}x = 180.`:`${mult}x − ${shift} + x + ${shift} = 180. Числа −${shift} и +${shift} сокращаются: ${coefficient}x = 180.`),S('Какое число останется справа после переноса свободных слагаемых?',remainder,variant===0?`2x = 180 − ${d} = ${remainder}.`:`Свободные слагаемые уже отсутствуют: ${coefficient}x = 180.`),S('Чему равен x?',x,`x = ${remainder} : ${coefficient} = ${F(x)}. Проверка углов: ${F(a)}° + ${F(b)}° = 180°.`)];
  diagram=angleDiagram('O',{A:0,C:a,B:180},[angle('AOC','O','A','C',a,left+'°',1),angle('COB','O','C','B',b,right+'°',2)],'OA и OB — противоположные лучи одной прямой; OC — общая сторона смежных углов.');
  params={d,mult,shift,x,a,b,coefficient,remainder};elements=[element('AOC','∠AOC','Первый угол ограничен лучами OA и OC.'),element('COB','∠COB','Второй угол ограничен лучами OC и OB.'),element('ray-C','Общая сторона OC','Луч OC принадлежит обоим смежным углам.')];
 }else if(id==='grade7-g-vertical-chain'){
  const a=40+2*(n%41),small=variant===2?2*(25+n%31):a;
  answer=variant===0?a:variant===1?180-a:small/2;
  if(variant===0){
   q=`Прямые AB и CD пересекаются в O. ∠AOC = ${a}°. Найди ∠BOD.`;
   steps=[choice('Какой угол является вертикальным к AOC?',['∠COB','∠BOD','∠DOA'],1,'У вертикального угла обе стороны противоположны сторонам исходного: OA ↔ OB, OC ↔ OD.'),S('Найди ∠COB в градусах.',180-a,`Смежный с AOC угол COB равен 180° − ${a}° = ${180-a}°.`),S('Найди ∠BOD в градусах.',answer,`∠BOD = ∠AOC = ${a}°, потому что это вертикальные углы.`)];
  }else if(variant===1){
   q=`Прямые AB и CD пересекаются в O. ∠COB = ${a}°. Найди ∠AOC.`;
   steps=[S('Найди вертикальный к COB угол DOA в градусах.',a,`∠DOA = ∠COB = ${a}°.`),S('Чему равна сумма AOC и COB в градусах?',180,'Сторона OC общая, OA и OB противоположны: углы смежные.'),S('Найди ∠AOC в градусах.',answer,`∠AOC = 180° − ${a}° = ${answer}°.`)];
  }else{
   q=`Прямые AB и CD пересекаются в O. ∠AOC = ${small}°. OE — биссектриса BOD. Найди ∠BOE.`;
   steps=[S('Найди ∠BOD в градусах.',small,`∠BOD и ∠AOC — вертикальные: ∠BOD = ${small}°.`),S('На сколько равных частей OE делит BOD?',2,'По условию OE — биссектриса угла BOD.'),S('Найди ∠BOE в градусах.',answer,`∠BOE = ∠BOD : 2 = ${small}° : 2 = ${answer}°.`)];
  }
  const theta=variant===1?180-a:small,rays={A:0,C:theta,B:180,D:180+theta,...(variant===2?{E:180+theta/2}:{})};
  const angles=[angle('AOC','O','A','C',theta,variant===1?'?':`${small}°`,1),angle('COB','O','C','B',180-theta,variant===1?`${a}°`:'',2),angle('BOD','O','B','D',theta,variant===0?'?':'',1),angle('DOA','O','D','A',180-theta,'',2)];
  if(variant===2)angles.push(angle('BOE','O','B','E',theta/2,'?',3),angle('EOD','O','E','D',theta/2,'',3));
  angles.forEach(x=>x.radius=x.marks===1?36:x.marks===2?53:82);
  diagram=angleDiagram('O',rays,angles,'AB и CD — прямые. Одинаковые дуги отмечают известные равные вертикальные углы; при наличии биссектрисы её части отмечены отдельно.',true);
  params={a,theta};elements=angles.map(x=>element(x.id,'∠'+x.from+'O'+x.to,`Стороны угла — ${'O'+x.from} и ${'O'+x.to}. Сначала найди нужную пару углов.`));
 }else{
  const ab=8+n%9,bc=9+Math.floor(n/3)%8,ac=10+Math.floor(n/7)%7,mapping=[['D','E','F'],['E','F','D'],['F','D','E']][variant],target=variant===0?'EF':variant===1?'ED':'DE';
  const corresponding=variant===1?'AC':'BC',given=variant===1?ac:bc,offset=given%2?3:2,x=(given-offset)/2;
  answer=variant===2?x:given;
  q=`Дано: △ABC = △${mapping.join('')}. AB = ${ab} см, BC = ${bc} см, AC = ${ac} см. ${variant===2?`${target} = (2x + ${offset}) см. Найди x.`:`Найди ${target} в сантиметрах.`}`;
  steps=[choice('Какой вершине соответствует вершина B?',mapping,1,`Сопоставь буквы по порядку: A ↔ ${mapping[0]}, B ↔ ${mapping[1]}, C ↔ ${mapping[2]}.`),choice(`Какая сторона первого треугольника соответствует ${target}?`,['AB','BC','AC'],variant===1?2:1,`Концы стороны соответствуют по записи равенства треугольников, поэтому ${target} = ${corresponding}.`),...(variant===2?[S(`Чему равно 2x после вычитания ${offset} из обеих частей?`,given-offset,`${target} = BC, значит, 2x + ${offset} = ${given}; 2x = ${given} − ${offset} = ${given-offset}.`),S('Чему равен x?',x,`x = ${given-offset} : 2 = ${x}. Проверка: 2 · ${x} + ${offset} = ${given} см.`)]:[S(`Найди ${target} в сантиметрах.`,answer,`Соответствующие стороны данных равных треугольников равны: ${target} = ${corresponding} = ${given} см.`)])];
  const localX=(ab*ab+ac*ac-bc*bc)/(2*ab),localY=Math.sqrt(ac*ac-localX*localX),scale=175/Math.max(ab,ac,localY);
  const coordinates=[[0,0],[ab,0],[localX,localY]],points={};
  coordinates.forEach(([px,py],i)=>{points['ABC'[i]]=P(65+px*scale,255-py*scale,i===0?-16:16,i===2?-10:24);points[mapping[i]]=P(520-px*scale,255-py*scale,i===0?16:-16,i===2?-10:24);});
  const pairs=[['A','B',ab,0,1],['B','C',bc,1,2],['A','C',ac,0,2]],segments=[];
  for(let i=0;i<pairs.length;i++){
   const [from,to,length,ia,ib]=pairs[i],other=mapping[ia]+mapping[ib],isTarget=[...other].sort().join('')===[...target].sort().join('');
   segments.push(segment('pair-'+from+to,from,to,`${length} см`,0,i+1));
   segments.push(segment('pair-'+from+to,mapping[ia],mapping[ib],isTarget?(variant===2?`2x + ${offset}`:'?'):'',0,i+1));
  }
  diagram={type:'triangles',description:`Равенство △ABC = △${mapping.join('')} дано. Один, два и три штриха показывают соответствующие пары сторон.`,points,segments,angles:[]};
  params={ab,bc,ac,mapping,target,corresponding,offset,x};elements=pairs.map(([from,to,length,ia,ib])=>element('pair-'+from+to,`${from+to} ↔ ${mapping[ia]+mapping[ib]}`,`Это соответствующие стороны по данному равенству треугольников.`));
 }
 return {id,seed,pos:null,grade7:true,subject:'geometry',trainingOnly:true,strict:true,variant,q,answer,steps,params,model:{kind:'grade7-geometry',diagram,elements}};
}
D.meta.push(...families.map(m=>({...m,pos:null,trainingOnly:true,grade7:true,subject:'geometry',expanded:true})));
D.task=(id,seed=1)=>ids.has(id)?build(id,seed):previous(id,seed);
D.grade7Geometry={families,count,has:id=>ids.has(id)};
if(typeof module!=='undefined')module.exports=D;
})(typeof window==='undefined'?globalThis:window);
