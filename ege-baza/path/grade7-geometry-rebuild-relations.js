/* Original stepwise lessons for printed source sections 12–17; no copied figures. */
(function(root){'use strict';
const H=root.Grade7Rebuild;if(!H)throw Error('Load grade7-geometry-rebuild-base first');
const rad=x=>x*Math.PI/180,round=x=>Math.round(x*1e8)/1e8;
const N=(q,a,why,feedback={})=>H.num(q,round(a),why,feedback);
const C=(q,labels,good,n,why,feedback=[])=>H.choice(q,labels,good,n,why,labels.map((label,i)=>feedback[i]||`«${label}» не подходит. ${why}`));
const types=['Накрест лежащие внутренние','Соответственные','Односторонние внутренние'];
const reasons=['Углы внутри полосы и по разные стороны секущей.','Углы занимают одинаковое положение при двух пересечениях.','Углы внутри полосы и по одну сторону секущей.'];
function rotate(world,n){const t=rad([-12,0,14,27][n%4]),c=Math.cos(t),s=Math.sin(t);return Object.fromEntries(Object.entries(world).map(([k,p])=>[k,{x:p.x*c-p.y*s,y:p.x*s+p.y*c}]));}
function fig(world,segments,angles,description,n=0){return H.diagram(description,H.project(rotate(world,n)),segments,angles);}
const S=H.seg,A=H.angle;
function register(key,title,section,pages,idea,prerequisites,build){H.register({key,title,section,sourcePages:pages,idea,prerequisites,build});}
function finish(q,steps,d,params){return H.make({q,steps,diagram:d,params});}
function parallel(alpha,type,n,target='x',given=null,givenKind='usual'){
 const t=rad(alpha),u={x:Math.cos(t),y:Math.sin(t)},P={x:0,y:1.15},Q={x:-2.3/Math.tan(t),y:-1.15};
 const w={P,Q,A:{x:P.x-2.5,y:P.y},B:{x:P.x+2.5,y:P.y},C:{x:Q.x-2.5,y:Q.y},D:{x:Q.x+2.5,y:Q.y},E:{x:P.x+2*u.x,y:P.y+2*u.y},F:{x:Q.x-2*u.x,y:Q.y-2*u.y}};
 const first=type===0?['P','A','F']:type===1?['P','B','E']:['P','B','F'];
 const second=givenKind==='supplement'?['Q','C','E']:givenKind==='vertical'?['Q','C','F']:['Q','D','E'];
 const d=fig(w,[S('line-a','A','B'),S('line-b','C','D'),S('secant','E','F')],[A('target',...first,{label:target,radius: 27}),A('given',...second,{label:given===null?'2':given+'°',radius: 27})],'Прямые AB и CD пересечены секущей EF в разных точках P и Q. Дуги отмечают выбранные углы.',n);
 return d;
}
register('parallel-pairs','Пары углов и секущая',12,[54,56],'Тип пары зависит от положения углов, а не от их номеров.',['adjacent-identify','vertical-identify'],n=>{
 const type=n%3,alpha=36+Math.floor(n/3)%24,d=parallel(alpha,type,n,'1');
 return finish('Прямые AB и CD пересечены в точках P и Q прямой EF. Как называется отмеченная пара углов 1 и 2?',[
 C('Какая прямая пересекает обе другие в разных точках?',['EF','AB','CD'],0,n,'EF проходит через P и Q — точки пересечения с AB и CD.'),
 C('Как называется пара отмеченных углов?',types,type,n,reasons[type])],d,{kind:'pairs',type,alpha});
});
function criterion(type,n){
 const mode=Math.floor(n/24),alpha=38+n%24,offset=5+n%9,desired=type=== 2?180-alpha:alpha,given=mode===1?180-alpha:alpha,label=mode=== 2?`x + ${offset}°`:'x',givenKind=mode===1?'supplement':'usual';
 const d=parallel(alpha,type,n,label,given,givenKind),q=`При каком значении x прямые AB и CD будут параллельны? На рисунке дан угол ${given}°${mode=== 2?`, искомый угол равен x + ${offset}°`:''}.`;
 const steps=[];
 if(mode===1)steps.push(N('Найди угол DQE, смежный с данным углом CQE.',alpha,`Смежные углы в сумме дают 180°: 180° − ${given}° = ${alpha}°.`));
 steps.push(C('Какую пару образуют искомый угол при P и угол DQE?',types,type,n,reasons[type]));
 steps.push(C('Какое условие этой пары гарантирует параллельность?',['Углы равны','Сумма углов равна 180°','Достаточно, что оба угла острые'],type=== 2?1:0,n,type=== 2?'Это признак по сумме односторонних внутренних углов.':'Это признак параллельности по равенству выбранных углов.'));
 if(mode=== 2)steps.push(N('Чему должен равняться весь угол x + '+offset+'°?',desired,type=== 2?`180° − ${alpha}° = ${desired}°.`:`Он должен равняться углу DQE: ${alpha}°.`));
 steps.push(N('Найди x в градусах.',desired-(mode=== 2?offset:0),mode=== 2?`${desired}° − ${offset}° = ${desired-offset}°.`:type=== 2?`Для параллельности x + ${alpha}° =180°, значит x = ${desired}°.`:`Для параллельности x = ${alpha}°.`));
 return finish(q,steps,d,{kind:'criterion',type,mode,alpha,offset,given});
}
register('parallel-alternate','Признак: накрест лежащие углы',12,[57,59],'Равные накрест лежащие внутренние углы дают параллельность.',['parallel-pairs','adjacent-calc'],n=>criterion(0,n));
register('parallel-corresponding','Признак: соответственные углы',12,[57,59],'Равные соответственные углы дают параллельность.',['parallel-pairs','adjacent-calc'],n=>criterion(1,n));
register('parallel-sameside','Признак: сумма односторонних углов',12,[57,59],'Сумма 180° для односторонних внутренних углов даёт параллельность.',['parallel-pairs','adjacent-calc'],n=>criterion(2,n));
register('parallel-equal-angles','Равные углы при параллельных прямых',13,[60,61],'Из известной параллельности получаем равенство углов — это свойство.',['parallel-alternate','parallel-corresponding'],n=>{
 const type=n%2,mode=Math.floor(n/24),alpha=35+n%24,given=mode===1?180-alpha:alpha,d=parallel(alpha,type,n,'x',given,mode===1?'supplement':mode=== 2?'vertical':'usual');
 const steps=[C('Параллельность уже известна. Мы используем признак или свойство?',['Свойство параллельных прямых','Признак параллельности'],0,n,'Дано AB ∥ CD; из этого получаем равенство углов, а не доказываем параллельность.')];
 if(mode===1)steps.push(N('Найди угол DQE, смежный с данным.',alpha,`180° − ${given}° = ${alpha}°.`));
 if(mode=== 2)steps.push(N('Найди угол DQE, вертикальный данному.',alpha,'Вертикальные углы равны.'));
 steps.push(N('Найди отмеченный угол x.',alpha,`${types[type]} при параллельных прямых равны: x = ${alpha}°.`));
 return finish(`AB ∥ CD, EF — секущая. Данный угол равен ${given}°. Найди x.`,steps,d,{kind:'parallel-equal',type,mode,alpha,given});
});
register('parallel-supplement','Односторонние углы: сумма 180°',13,[60,63],'При параллельных прямых односторонние внутренние углы дополняют друг друга до 180°.',['parallel-sameside'],n=>{
 const alpha=30+(n*7)%121,d=parallel(alpha,2,n,'x',alpha);
 return finish(`AB ∥ CD. Угол DQE равен ${alpha}°. Найди отмеченный односторонний с ним угол x.`,[
 C('Как связаны эти односторонние внутренние углы?',['Их сумма 180°','Они всегда равны','Их сумма 90°'],0,n,'Для параллельных прямых сумма односторонних внутренних углов равна 180°; равными они бывают только по 90°.'),
 N('Найди x.',180-alpha,`180° − ${alpha}° = ${180-alpha}°.`,{[String(alpha)]:'Равенство односторонних углов бывает лишь в частном случае 90°. Здесь нужна сумма 180°.'})],d,{kind:'parallel-supplement',alpha});
});
register('angle-parallel-sides','Углы с параллельными или перпендикулярными сторонами',13,[62,63],'Такие углы либо равны, либо имеют сумму 180°; выбираем по указанному виду угла.',['parallel-equal-angles','parallel-supplement','perpendicular'],n=>{
 const mode=n%4,alpha=32+Math.floor(n/4)%18,obtuse=mode%2===1,perp=mode>= 2,shift=perp?90:0,target=obtuse?180-alpha:alpha;
 const w={O:{x:0,y:0},X:{x: 2,y:0},Y:{x: 2*Math.cos(rad(alpha)),y: 2*Math.sin(rad(alpha))},P:{x:5,y:2.5},U:{x:5+2*Math.cos(rad(shift+(obtuse?180:0))),y:2.5+2*Math.sin(rad(shift+(obtuse?180:0)))},V:{x:5+2*Math.cos(rad(shift+alpha)),y:2.5+2*Math.sin(rad(shift+alpha))}};
 const d=fig(w,[S('OX','O','X'),S('OY','O','Y'),S('PU','P','U'),S('PV','P','V')],[A('known','O','X','Y',{label:alpha+'°'}),A('wanted','P','U','V',{label:'x'})],'Отмечены два угла. Пары сторон OX/PU и OY/PV имеют указанное в условии взаимное положение.',n);
 return finish(`OX ${perp?'⟂':'∥'} PU и OY ${perp?'⟂':'∥'} PV. Угол XOY равен ${alpha}°, угол UPV — ${obtuse?'тупой':'острый'}. Найди угол UPV.`,[
 C('Какие два значения в принципе возможны для второго угла?',[`${alpha}° или ${180-alpha}°`,`${alpha}° или ${90-alpha}°`,'Всегда только 90°'],0,n,'Если обе пары сторон соответственно параллельны или перпендикулярны, углы равны либо дают сумму 180°.'),
 N('Выбери подходящее значение угла UPV.',target,obtuse?`Тупой угол больше 90°, поэтому подходит ${180-alpha}°.`:`Острый угол меньше 90°, поэтому подходит ${alpha}°.`)],d,{kind:'angle-directions',alpha,obtuse,perp,target});
});
function triangleWorld(alpha,beta,base=8){const gamma=180-alpha-beta,b=base*Math.sin(rad(beta))/Math.sin(rad(gamma));return {A:{x:0,y:0},B:{x:base,y:0},C:{x:b*Math.cos(rad(alpha)),y:b*Math.sin(rad(alpha))}};}
function tri(alpha,beta,n,labels={},extra={}){const world=triangleWorld(alpha,beta),d=fig(world,[S('AB','A','B'),S('BC','B','C'),S('CA','C','A')],Object.entries(labels).map(([v,label])=>A('angle-'+v,v,...({A:['B','C'],B:['A','C'],C:['A','B']}[v]),{label})), 'Треугольник ABC: используем данные углы и отметки, не измеряем рисунок.',n);return {world,d,...extra};}
function withExtension(t,n,vertex='A',vertical=false){const w={...t.world};if(vertex==='A'){w.D={x:-2.5,y:0};if(vertical)w.E={x:-w.C.x*.45,y:-w.C.y*.45};}else w.D={x:w.C.x+(w.C.x-w.B.x)*.5,y:w.C.y+(w.C.y-w.B.y)*.5};t.d.points=H.project(rotate(w,n));t.d.segments.push(S('extension','D',vertex));if(vertical)t.d.segments.push(S('vertical-extension','E','A'));return w;}
register('triangle-angle-sum','Третий угол треугольника',14,[64,65],'Сумма внутренних углов равна 180°; сначала отличаем внутренний угол от внешнего.',['triangle-elements','adjacent-calc','vertical-calc'],n=>{
 const mode=Math.floor(n/24),alpha=32+n%18,beta=43+(n*3)%24,gamma=180-alpha-beta,given=mode===1?180-alpha:alpha,t=tri(alpha,beta,n,{B:beta+'°',C:'x'}),steps=[];
 if(mode){withExtension(t,n,'A',mode=== 2);t.d.angles.push(A('given', 'A', 'D',mode=== 2?'E':'C',{label:given+'°'}));steps.push(N('Чему равен внутренний угол BAC?',alpha,mode===1?`Он смежный с ${given}°: 180° − ${given}° = ${alpha}°.`:'Он вертикальный данному углу, значит равен ему.'));}else t.d.angles.push(A('given','A','B','C',{label:alpha+'°'}));
 steps.push(N('Найди сумму внутренних углов A и B.',alpha+beta,`${alpha}° + ${beta}° = ${alpha+beta}°.`));steps.push(N('Найди угол C.',gamma,`180° − ${alpha+beta}° = ${gamma}°.`));
 return finish(`В треугольнике ABC угол B равен ${beta}°. ${mode===1?'Внешний, смежный с углом A':mode=== 2?'Вертикальный углу A угол':'Угол A'} равен ${given}°. Найди угол C.`,steps,t.d,{kind:'triangle-sum',mode,alpha,beta,gamma,given});
});
register('triangle-angle-type','Вид треугольника по углам',14,[64,68],'Вид всего треугольника определяет его наибольший угол.',['triangle-angle-sum','angle-type'],n=>{
 const mode=n%3,alpha=mode===0?50+Math.floor(n/3)%12: 20+Math.floor(n/3)%15,beta=mode===0?49+Math.floor(n/3)%9:mode===1?90-alpha: 25+Math.floor(n/3)%11,gamma=180-alpha-beta,max=Math.max(alpha,beta,gamma),good=max<90?0:max===90?1: 2,t=tri(alpha,beta,n,{A:alpha+'°',B:beta+'°',C:'?'});
 return finish(`Углы A и B треугольника ABC равны ${alpha}° и ${beta}°. Каков вид треугольника по углам?`,[
 N('Найди третий угол C.',gamma,`180° − ${alpha}° − ${beta}° = ${gamma}°.`),N('Какой угол самый большой, в градусах?',max,'Сравни все три внутренних угла.'),C('Определи вид треугольника.',['Остроугольный','Прямоугольный','Тупоугольный'],good,n,max<90?'Все три угла меньше 90°.':max===90?'Один угол равен 90°, остальные острые.':'Один угол больше 90°, значит треугольник тупоугольный.')],t.d,{kind:'triangle-type',alpha,beta,gamma});
});
register('triangle-isosceles-angles','Углы равнобедренного треугольника',14,[65,66],'Равные боковые стороны дают равные углы при основании; затем используем 180°.',['triangle-angle-sum','triangle-isosceles-base'],n=>{
 const mode=Math.floor(n/24),base=34+n%24,vertex=180-2*base,t=tri(base,base,n,mode===1?{C:vertex+'°',A:'x'}:{B:base+'°',C:'x'});t.d.segments[1].marks=t.d.segments[2].marks=1;
 if(mode=== 2){t.d.angles=t.d.angles.filter(a=>a.id!=='angle-B');withExtension(t,n);t.d.angles.push(A('outer','A','D','C',{label:(180-base)+'°'}));}
 const steps=[C('Какие внутренние углы равны из CA = CB?',['Углы A и B','Углы A и C','Углы B и C'],0,n,'Равным сторонам CA и CB противоположны углы B и A, это углы при основании AB.')];
 if(mode===1)steps.push(N('Найди сумму равных углов при основании.',2*base,`180° − ${vertex}° = ${2*base}°.`),N('Найди угол A.',base,`${2*base}° : 2 = ${base}°.`));else{steps.push(N('Найди угол A.',base,mode=== 2?`180° − ${180-base}° = ${base}°.`:'Он равен углу B при основании.'));steps.push(N('Найди угол C.',vertex,`180° − 2 · ${base}° = ${vertex}°.`));}
 return finish(`В ABC стороны CA и CB равны. ${mode===1?`Угол C равен ${vertex}°. Найди угол A.`:mode=== 2?`Внешний угол при A равен ${180-base}°. Найди угол C.`:`Угол B равен ${base}°. Найди угол C.`}`,steps,t.d,{kind:'isosceles-angles',mode,base,vertex});
});
register('triangle-exterior-angle','Внешний угол треугольника',14,[67,68],'Внешний угол равен сумме двух внутренних, не смежных с ним.',['triangle-angle-sum','adjacent-identify'],n=>{
 const mode=Math.floor(n/24),alpha=31+n%24,beta=39+(n*2)%29,outer=alpha+beta,gamma=180-outer,t=tri(alpha,beta,n,{A:alpha+'°',...(mode===0?{B:beta+'°'}:{})});withExtension(t,n,'C');t.d.angles.push(A('outer','C','A','D',{label:mode===0?'x':outer+'°'}));if(mode===1)t.d.angles.push(A('target','B','A','C',{label:'x'}));if(mode=== 2)t.d.angles.push(A('target','C','A','B',{label:'x',radius: 21}));
 const steps=[C('Какие внутренние углы не смежны внешнему ACD?',['A и B','A и C','B и C'],0,n,'Внешний ACD смежен внутреннему C; удалённые от него внутренние углы — A и B.')];
 if(mode===0)steps.push(N('Найди внешний угол ACD.',outer,`${alpha}° + ${beta}° = ${outer}°.`));else if(mode===1)steps.push(N('Найди угол B.',beta,`${outer}° − ${alpha}° = ${beta}°.`));else steps.push(N('Найди внутренний угол C.',gamma,`Внешний и внутренний углы смежные: 180° − ${outer}° = ${gamma}°.`));
 return finish(`BC продолжена за C до D. ${mode===0?`Углы A и B равны ${alpha}° и ${beta}°. Найди внешний угол ACD.`:mode===1?`Внешний ACD равен ${outer}°, угол A — ${alpha}°. Найди угол B.`:`Внешний ACD равен ${outer}°. Найди внутренний угол C.`}`,steps,t.d,{kind:'exterior',mode,alpha,beta,outer,gamma});
});
function sss(sides){const [a,b,c]=sides,x=(b*b+c*c-a*a)/(2*c);return {A:{x:0,y:0},B:{x:c,y:0},C:{x,y:Math.sqrt(b*b-x*x)}};}
register('triangle-side-angle-order','Сторона и противолежащий угол',15,[69,72],'Наибольшей стороне противоположен наибольший угол; равных максимумов может быть несколько.',['triangle-angle-sum','triangle-elements'],n=>{
 const mode=Math.floor(n/24),sub=n%4,k=Math.floor((n%24)/4),names=['A','B','C'],sideNames=['BC','CA','AB'];let values,d,q,kind;
 if(mode===0){values=sub===0?[5+k,7+k,9+k]:sub===1?[8+k,8+k,5+k]:sub=== 2?[6+k,6+k,6+k]:[9+k,6+k,8+k];d=fig(sss(values),[S('BC','B','C',{label:values[0]+' см'}),S('CA','C','A',{label:values[1]+' см'}),S('AB','A','B',{label:values[2]+' см'})],[],'Длины сторон заданы точно. Ищем все наибольшие углы, в том числе равные.',n);q=`BC = ${values[0]}, CA = ${values[1]}, AB = ${values[2]} см. Назови все наибольшие углы треугольника ABC.`;kind='angles';}
 else{values=sub===0?[44+k,58,78-k]:sub===1?[70,70,40]:sub=== 2?[60,60,60]:[36,91+k,53-k];const t=tri(values[0],values[1],n,{A:values[0]+'°',B:values[1]+'°',...(mode===1?{C:values[2]+'°'}:{C:'?'})});d=t.d;q=`Углы A и B равны ${values[0]}° и ${values[1]}°${mode===1?`, угол C — ${values[2]}°`:''}. Назови все наибольшие стороны ABC.`;kind='sides';}
 const max=Math.max(...values),ids=values.flatMap((x,i)=>x===max?[i]:[]),answer=ids.map(i=>kind==='angles'?'∠'+names[i]:sideNames[i]).join(' и '),options=[answer,...(kind==='angles'?['∠A','∠B','∠C','∠A и ∠B','∠A и ∠B и ∠C']:['BC','CA','AB','BC и CA','BC и CA и AB']).filter(x=>x!==answer)].slice(0,4),steps=[];
 if(mode=== 2)steps.push(N('Найди угол C.',values[2],`180° − ${values[0]}° − ${values[1]}° = ${values[2]}°.`));
 steps.push(N(mode===0?'Чему равна наибольшая длина стороны?':'Чему равен наибольший угол?',max,'Сравни все три величины; у равных наибольших значений сохрани оба или все три элемента.'));
 steps.push(C(kind==='angles'?'Назови все наибольшие углы.':'Назови все наибольшие стороны.',options,0,n,'Против A лежит BC, против B — CA, против C — AB. Сохраняем все равные максимумы.'));
 return finish(q,steps,d,{kind:'order',mode,values,resultKind:kind});
});
function rods(values,n,labels=['a','b','c']){const w={},segments=[],gap=Math.max(...values)*.28;values.forEach((v,i)=>{const a=['A','C','E'][i],b=['B','D','F'][i];w[a]={x:0,y:-i*gap};w[b]={x:v,y:-i*gap};segments.push(S('rod'+i,a,b,{label:`${labels[i]} = ${v} см`}));});return fig(w,segments,[],'Показаны отдельные заданные отрезки. Их ещё нельзя считать сторонами существующего треугольника.',1);}
register('triangle-inequality','Существует ли треугольник',15,[71,72],'Длины положительны; сумма двух меньших строго больше наибольшей.',['triangle-side-angle-order'],n=>{
 const mode=n%4,scale=mode===3?10:1,a= 24+Math.floor(n/4)%13,b=18+(n*3)%11,delta=mode===0?-2:mode===1?0:mode=== 2?2:(n%3)-1,values=[a,b,a+b+delta].map(x=>x/scale),sum=round(values[0]+values[1]),max=values[2],valid=sum>max,relation=sum<max?0:sum===max?1: 2,d=rods(values,n),steps=[N('Найди сумму двух меньших длин.',sum,`${values[0]} + ${values[1]} = ${sum} см.`),C('Сравни эту сумму с наибольшей длиной.', ['Сумма меньше','Сумма равна','Сумма больше'],relation,n,`Сравни ${sum} и ${max}. Для треугольника нужно строго больше.`),C('Существует ли такой треугольник?',['Да','Нет'],valid?0:1,n,valid?'Все длины положительны, сумма двух меньших строго больше третьей.':sum===max?'При равенстве получаем вырожденный отрезок, а не треугольник.':'Две короткие стороны не смогут соединиться: их сумма меньше третьей.')];
 return finish(`Можно ли построить треугольник со сторонами ${values.join(', ')} см?`,steps,d,{kind:'inequality',values,mode});
});
register('triangle-third-side','Допустимая третья сторона',15,[71,72],'Для третьей стороны c нужны строгие границы |a−b| < c < a+b.',['triangle-inequality'],n=>{
 const mode=Math.floor(n/24),a=9+n%9,b=3+(n*3)%5,low=a-b,high=a+b,steps=[N('Найди нижнюю границу: разность двух данных длин.',low,`${a} − ${b} = ${low} см. Третья сторона должна быть строго больше.`),N('Найди верхнюю границу: сумму двух данных длин.',high,`${a} + ${b} = ${high} см. Третья сторона должна быть строго меньше.`)];
 let q;if(mode=== 2){q=`Две стороны равны ${a} и ${b} см. Какая из предложенных длин может быть третьей?`;steps.push(C('Выбери допустимую третью сторону.',[`${low} см`,`${high} см`,`${low+1} см`,'0 см'],2,n,`Нужно ${low} < c < ${high}. Граничные значения и нулевая длина не подходят.`));}else{q=`Две стороны равны ${a} и ${b} см. Найди ${mode===0?'наименьшую':'наибольшую'} целую длину третьей стороны.`;steps.push(N('Найди нужную целую длину.',mode===0?low+1:high-1,mode===0?`Первое целое строго больше ${low} — ${low+1}.`:`Последнее целое строго меньше ${high} — ${high-1}.`));}
 return finish(q,steps,rods([a,b],n),{kind:'third-side',mode,a,b});
});
function rightWorld(alpha,h=10){return {C:{x:0,y:0},A:{x:h*Math.cos(rad(alpha)),y:0},B:{x:0,y:h*Math.sin(rad(alpha))}};}
function right(alpha,n,h=10){const world=rightWorld(alpha,h),d=fig(world,[S('AB','A','B'),S('BC','B','C'),S('CA','C','A')],[A('right','C','A','B',{right:true,marks:3,radius: 20})],'В треугольнике ABC угол C прямой. AB — гипотенуза; AC и BC — катеты.',n);return {world,d};}
register('right-acute-angles','Острые углы прямоугольного треугольника',16,[73,76],'Два острых угла в сумме 90°; равные катеты дают 45° и 45°.',['triangle-angle-sum','triangle-isosceles-angles'],n=>{
 const mode=Math.floor(n/18),r=[[1,1],[1,2],[1,4],[2,3],[3,2],[4,1]][n%6],alpha=mode=== 2?90*r[0]/(r[0]+r[1]):mode===3?45: 24+n%18,beta=90-alpha,t=right(alpha,n),steps=[];let q;
 if(mode===1){const w={...t.world,D:{x:t.world.A.x+3,y:0}};t.d.points=H.project(rotate(w,n));t.d.segments.push(S('extension','A','D'));t.d.angles.push(A('outer','A','B','D',{label:(180-alpha)+'°'}));q=`Угол C прямой, внешний угол при A равен ${180-alpha}°. Найди угол B.`;steps.push(N('Найди внутренний угол A.',alpha,`180° − ${180-alpha}° = ${alpha}°.`));}
 else if(mode=== 2){q=`В прямоугольном ABC (∠C = 90°) острые углы A:B = ${r[0]}:${r[1]}. Найди угол B.`;steps.push(N('Чему равна сумма острых углов?',90,'180° − 90° = 90°.'),N('Сколько градусов приходится на одну часть?',90/(r[0]+r[1]),`90° : (${r[0]} + ${r[1]}).`));}
 else if(mode===3){q='В прямоугольном ABC (∠C = 90°) AC = BC. Найди угол B.';t.d.segments[1].marks=t.d.segments[2].marks=1;steps.push(C('Какие углы равны вследствие AC = BC?',['A и B','A и C','B и C'],0,n,'Равным катетам противоположны острые углы B и A.'));}
 else{q=`Угол C прямой, угол A равен ${alpha}°. Найди угол B.`;t.d.angles.push(A('given','A','B','C',{label:alpha+'°'}));steps.push(N('Чему равна сумма острых углов?',90,'Из 180° вычитаем прямой угол 90°.'));}
 t.d.angles.push(A('target','B','A','C',{label:'x'}));steps.push(N('Найди угол B.',beta,mode=== 2?`Одна часть равна ${90/(r[0]+r[1])}°, поэтому B = ${r[1]} · ${90/(r[0]+r[1])}° = ${beta}°.`:mode===3?'Равные острые углы делят 90° пополам:45°.':`90° − ${alpha}° = ${beta}°.`));
 return finish(q,steps,t.d,{kind:'right-angles',mode,alpha,beta,ratio:r});
});
register('right-thirty','Катет напротив 30°',16,[73,76],'Катет напротив 30° равен половине гипотенузы; обратное утверждение требует прямого угла.',['right-acute-angles'],n=>{
 const mode=Math.floor(n/18),leg=4+n%18,h= 2*leg,t=right(30,n,h),steps=[C('Какая сторона лежит напротив угла A?',['BC','AC','AB'],0,n,'У стороны BC нет вершины A. AC прилегает к A, AB — гипотенуза.')];let q;
 if(mode=== 2){t.d.segments[0].label=h+' см';t.d.segments[1].label=leg+' см';q=`В ABC угол C прямой, AB = ${h} см, BC = ${leg} см. Найди угол A.`;steps.push(N('Во сколько раз гипотенуза длиннее катета BC?',2,`${h} : ${leg} = 2.`),N('Найди угол A напротив этого катета.',30,'В прямоугольном треугольнике катет, равный половине гипотенузы, лежит напротив 30°.'));}
 else if(mode===1){q=`Угол C прямой, угол A равен 30°, BC = ${leg} см. Найди AB.`;t.d.segments[1].label=leg+' см';t.d.segments[0].label='x';t.d.angles.push(A('thirty','A','B','C',{label:'30°'}));steps.push(N('Найди гипотенузу AB.',h,`BC — половина AB, поэтому AB = 2 · ${leg} = ${h} см.`));}
 else{q=`Угол C прямой, угол ${mode===3?'B равен 60°':'A равен 30°'}, AB = ${h} см. Найди BC.`;t.d.segments[0].label=h+' см';t.d.segments[1].label='x';t.d.angles.push(A('given',mode===3?'B':'A',mode===3?'A':'B','C',{label:mode===3?'60°':'30°'}));if(mode===3)steps.unshift(N('Найди угол A.',30,'90° − 60° = 30°.'));steps.push(N('Найди катет BC.',leg,`Катет напротив 30° равен половине гипотенузы: ${h} : 2 = ${leg} см.`));}
 return finish(q,steps,t.d,{kind:'right-thirty',mode,leg,h});
});
register('right-median','Медиана к гипотенузе',16,[73,76],'Медиана из прямого угла к гипотенузе равна половине гипотенузы.',['right-acute-angles','triangle-median','triangle-isosceles-angles'],n=>{
 const mode=Math.floor(n/18),median=5+n%18,h= 2*median,alpha= 27+n%29,t=right(alpha,n,h),w={...t.world,M:{x:(t.world.A.x+t.world.B.x)/2,y:(t.world.A.y+t.world.B.y)/2}};t.d.points=H.project(rotate(w,n));t.d.segments=t.d.segments.filter(s=>s.id!=='AB');t.d.segments.push(S('AM','A','M',{marks:1,label:mode=== 2?median+' см':''}),S('MB','M','B',{marks:1}),S('CM','C','M',{label:mode===1?median+' см':'x'}));
 if(mode===3){t.d.description='M — середина AB; AM = MB = CM. Угол ACB нужно найти.';t.d.angles=[A('target','C','A','B',{label:'x'})];t.d.segments.find(s=>s.id==='CM').marks=1;t.d.segments.find(s=>s.id==='CM').label=median+' см';return finish(`M — середина AB. AM = MB = CM = ${median} см. Найди угол ACB.`,[
 C('Какие углы равны в равнобедренных AMC и BMC?',['∠A = ∠ACM и ∠B = ∠MCB','∠A = ∠B без дополнительных условий','∠ACM = ∠MCB без дополнительных условий'],0,n,'AM = CM, поэтому углы A и ACM равны; BM = CM, поэтому углы B и MCB равны.'),
 C('Как связан целый угол C с углами A и B?',['∠C = ∠A + ∠B','∠C = 180°','∠C = ∠A − ∠B'],0,n,'Луч CM лежит внутри угла C. Складываем две его части: ∠ACM + ∠MCB = ∠A + ∠B.'),
 N('В сумме A + B + C = 180° заменяем A + B на C. Найди C.',90,'Получаем 2 · ∠C = 180°, поэтому ∠C = 90°. Так обоснован обратный признак.')],t.d,{kind:'right-median',mode,median,h,alpha});}
 const steps=[C('Почему CM — медиана к гипотенузе?',['M — середина AB, C — противоположная вершина','На рисунке CM кажется перпендикулярной AB','Любой отрезок из C — медиана'],0,n,'Медиана соединяет вершину с серединой противоположной стороны. Перпендикулярность здесь не требуется.')];let q;
 if(mode===1){q=`Угол C прямой, M — середина AB, CM = ${median} см. Найди AB.`;steps.push(N('Найди гипотенузу AB.',h,`AB = 2 · CM = 2 · ${median} = ${h} см.`));}
 else{q=`Угол C прямой, M — середина AB. ${mode===0?`AB = ${h}`:`AM = ${median}`} см. Найди CM.`;if(mode===0)steps.push(N('Найди половину AB.',median,`${h} : 2 = ${median} см.`));else steps.push(N('Найди всю гипотенузу AB.',h,`AM = MB, поэтому AB = 2 · ${median} = ${h} см.`));steps.push(N('Найди медиану CM.',median,`Медиана к гипотенузе равна её половине: ${h} : 2 = ${median} см.`));}
 return finish(q,steps,t.d,{kind:'right-median',mode,median,h,alpha});
});
const congruenceNames=['По двум катетам','По катету и прилежащему острому углу','По гипотенузе и острому углу','По гипотенузе и катету'];
function congruent(family,n){
 const mode=n%2,theta=31+Math.floor(n/2)%29,value=7+(n*5)%24,leg=mode?'BC':'CA',other=mode?'CA':'BC',other2=mode?'FD':'EF',acute=mode?'B':'A',acute2=mode?'E':'D';
 let u,v,h;if(family===0){h=value;u=h*Math.cos(rad(theta));v=h*Math.sin(rad(theta));}else if(mode){u=value;v=u*Math.tan(rad(theta));h=u/Math.cos(rad(theta));}else{v=value;u=v/Math.tan(rad(theta));h=v/Math.sin(rad(theta));}
 const w={C:{x:0,y:0},A:{x:u,y:0},B:{x:0,y:v}},turn=rad([0,90,180][Math.floor(n/2)%3]),co=Math.cos(turn),si=Math.sin(turn);for(const [x,y]of [['D','A'],['E','B'],['F','C']]){const p=w[y];w[x]={x:p.x*co-p.y*si,y:p.x*si+p.y*co};}const shiftX=u+h*.5-Math.min(w.D.x,w.E.x,w.F.x);for(const name of ['D','E','F'])w[name].x+=shiftX;
 const pairs={AB:'DE',BC:'EF',CA:'FD'},segments=Object.entries(pairs).flatMap(([s,t])=>[S(s,...s),S(t,...t)]),angles=[A('right-one','C','A','B',{right:true,marks:3,radius:18}),A('right-two','F','D','E',{right:true,marks:3,radius:18})];
 const mark=(id,m)=>{segments.find(s=>s.id===id).marks=m;segments.find(s=>s.id===pairs[id]).marks=m;};
 if(family===0){mark('BC',1);mark('CA',2);}else if(family===1)mark(leg,1);else if(family=== 2)mark('AB',1);else{mark('AB',1);mark(leg,2);}
 if(family===1||family=== 2){angles.push(A('acute-one',acute,mode?'A':'B','C',{marks:1,label:(mode?90-theta:theta)+'°'}),A('acute-two',acute2,mode?'D':'E','F',{marks:1}));}
 const known=family===0?'AB':other,target=family===0?'DE':other2;segments.find(s=>s.id===known).label=value+' см';segments.find(s=>s.id===target).label='x';
 const d=fig(w,segments,angles,'Два прямоугольных треугольника ABC и DEF. Соответствие вершин: A ↔ D, B ↔ E, C ↔ F. Равенства заданы отметками и условием.',n),condition=family===0?'AC = DF и BC = EF':family===1?`${leg} = ${pairs[leg]}, ∠${acute} = ∠${acute2}`:family=== 2?`AB = DE, ∠${acute} = ∠${acute2}`:`AB = DE и ${leg} = ${pairs[leg]}`;
 for(const ids of [['A','B','C'],['D','E','F']]){const ps=d.points,cx=ids.reduce((sum,id)=>sum+ps[id].x,0)/3,cy=ids.reduce((sum,id)=>sum+ps[id].y,0)/3;for(const id of ids){ps[id].dx=ps[id].x<cx?-18:18;ps[id].dy=ps[id].y<cy?-22:28;}for(const side of d.segments.filter(side=>side.label&&ids.includes(side.from)&&ids.includes(side.to))){const a=ps[side.from],b=ps[side.to],mx=(a.x+b.x)/2,my=(a.y+b.y)/2,dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),sign=(-dy*(mx-cx)+dx*(my-cy))>=0?1:-1;side.labelX=mx-sign*dy/len*31;side.labelY=my+sign*dx/len*31+6;}}
 const steps=[C('Какие стороны являются гипотенузами?',['AB и DE','AC и DF','BC и EF'],0,n,'Гипотенузы лежат напротив прямых углов C и F.')];
 if(family===1)steps.push(C('Как расположен выбранный острый угол относительно данного катета?',['Прилежит к нему в обоих треугольниках','В одном прилежит, а в другом лежит напротив','Его расположение не имеет значения'],0,n,`Углы ${acute} и ${acute2} прилежат к соответствующим катетам ${leg} и ${pairs[leg]}; это необходимое согласование.`));
 else steps.push(C('Какие данные кроме прямых углов заданы?',family===0?['Две пары равных катетов','Только две пары равных углов','Только одна пара сторон']:family=== 2?['Равные гипотенузы и равные острые углы','Только две пары острых углов','Один катет и произвольный угол']:['Равные гипотенузы и одна пара равных катетов','Только две стороны произвольных треугольников','Только два прямых угла'],0,n,`По условию ${condition}. Для признака используем именно эти пары.`));
 steps.push(C('По какому признаку равны эти прямоугольные треугольники?',congruenceNames,family,n,`${condition}; оба прямых угла уже заданы, поэтому применяем признак «${congruenceNames[family].toLowerCase()}».`));
 steps.push(C(`Какой стороне первого треугольника соответствует ${target}?`,['AB','BC','CA'],['AB','BC','CA'].indexOf(known),n,'Сопоставляем концы отрезков: A ↔ D, B ↔ E, C ↔ F.'));
 steps.push(N(`Найди ${target} в сантиметрах.`,value,`В равных треугольниках соответствующие стороны равны: ${target} = ${known} = ${value} см.`));
 return finish(`∠C = ∠F = 90°, ${condition}. ${known} = ${value} см. Найди ${target}.`,steps,d,{kind:'right-congruence',family,mode,theta,value,known,target,leg});
}
register('right-equal-legs','Равенство по двум катетам',17,[77,80],'Прямоугольность и две пары равных катетов позволяют переносить длины соответствующих элементов.',['right-acute-angles','triangle-proof-correspondence'],n=>congruent(0,n));
register('right-leg-angle','Равенство по катету и прилежащему углу',17,[77,80],'Равные острые углы должны одинаково прилегать к выбранным катетам.',['right-equal-legs'],n=>congruent(1,n));
register('right-hypotenuse-angle','Равенство по гипотенузе и острому углу',17,[77,80],'Различаем гипотенузу и катет; согласовываем острые вершины.',['right-equal-legs'],n=>congruent(2,n));
register('right-hypotenuse-leg','Равенство по гипотенузе и катету',17,[77,80],'Это признак именно для двух прямоугольных треугольников.',['right-equal-legs'],n=>congruent(3,n));
})(typeof window==='undefined'?globalThis:window);
