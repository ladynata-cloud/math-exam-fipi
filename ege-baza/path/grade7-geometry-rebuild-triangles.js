/* Original reasoning practice: congruence, triangle lines and circles. */
(function(root){'use strict';
const H=root.Grade7Rebuild,{point:P,seg:S,angle:A,diagram:D,num:N}=H;
const rad=d=>d*Math.PI/180;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const C=(q,labels,n,why,feedback=[])=>H.choice(q,labels,0,n,why,labels.map((_,i)=>i?(feedback[i]||'Этот вариант не следует из нужного условия. '+why):''));
const reg=(key,title,section,idea,prerequisites,build)=>H.register({key,title,section,sourcePages:({6:[33,36],7:[37,39],8:[40,42],9:[43,46],10:[47,50],11:[51,53]})[section],idea,prerequisites,build});
const finish=(q,steps,d,params)=>H.make({q,steps,diagram:d,params});
function project(world,n=0){
 const t=rad((Math.floor(n/12)%3-1)*12),flip=n%2?-1:1;
 return H.project(Object.fromEntries(Object.entries(world).map(([id,p])=>[id,{x:flip*(p.x*Math.cos(t)-p.y*Math.sin(t)),y:p.x*Math.sin(t)+p.y*Math.cos(t)}])));
}
function pair(n,mode='sas'){
 const b=5+n%7,c=1+Math.floor(n/7)%3,h=4+Math.floor(n/21)%4;
 const first={A:{x:0,y:0},B:{x:b,y:0},C:{x:c,y:h}},theta=rad((n%3-1)*20),flip=n%2?-1:1;
 const world={...first};['A','B','C'].forEach((id,i)=>{const p=first[id];world['DEF'[i]]={x:17+flip*p.x*Math.cos(theta)-p.y*Math.sin(theta),y:p.x*flip*Math.sin(theta)+p.y*Math.cos(theta)};});
 const points=H.project(world),segments=[S('AB','A','B',{marks:1}),S('BC','B','C',mode==='sss'?{marks:3}:{}),S('AC','A','C',mode==='sas'||mode==='sss'?{marks:2}:{}),S('DE','D','E',{marks:1}),S('EF','E','F',mode==='sss'?{marks:3}:{}),S('DF','D','F',mode==='sas'||mode==='sss'?{marks:2}:{})];
 const angles=mode==='sas'?[A('BAC','A','B','C',{marks:1}),A('EDF','D','E','F',{marks:1})]:mode==='asa'?[A('BAC','A','B','C',{marks:1}),A('EDF','D','E','F',{marks:1}),A('ABC','B','A','C',{marks:2}),A('DEF','E','D','F',{marks:2})]:[];
 return {d:D('Два треугольника; одинаковые засечки и дуги обозначают только данные равенства.',points,segments,angles),b,c,h,world};
}
function kite(n,mode='sas'){
 const h=4+n%6,b=3+Math.floor(n/6)%4,c=2+Math.floor(n/24)%3,world={A:{x:0,y:h},B:{x:-b,y:0},C:{x:0,y:-c},D:{x:b,y:0}};
 const segments=[S('AB','A','B',{marks:1}),S('AD','A','D',{marks:1}),S('BC','B','C',mode==='sss'?{marks:2}:{}),S('CD','C','D',mode==='sss'?{marks:2}:{}),S('AC','A','C')];
 const angles=mode==='sas'?[A('BAC','A','B','C',{marks:1}),A('CAD','A','C','D',{marks:1})]:[];
 return {d:D('Треугольники ABC и ADC расположены по разные стороны от общей стороны AC.',project(world,n),segments,angles),world,h,b,c};
}
function cross(n){
 const u=4+n%6,v=3+Math.floor(n/6)%4,beta=35+5*(Math.floor(n/24)%3)+n%4*5,t=rad(180-beta);
 const world={O:{x:0,y:0},A:{x:-u,y:0},C:{x:u,y:0},B:{x:v*Math.cos(t),y:v*Math.sin(t)},D:{x:-v*Math.cos(t),y:-v*Math.sin(t)}};
 const segments=[S('AO','A','O',{marks:1}),S('OC','O','C',{marks:1}),S('BO','B','O',{marks:2}),S('OD','O','D',{marks:2}),S('AB','A','B'),S('CD','C','D')];
 return {d:D('Прямые AC и BD пересекаются в O. Отметки дают AO = OC и BO = OD.',project(world,n),segments),world,beta,u,v};
}
function cevian(n,type){
 const half=3+n%9,h=5+Math.floor(n/9)%8,foot=[half/2,-half][Math.floor(n/36)%2],a=type==='height'?foot:half*.4;
 const world={A:{x:a,y:h},B:{x:0,y:0},C:{x:2*half,y:0}};
 let x=half;
 if(type==='bisector'){const ab=distance(world.A,world.B),ac=distance(world.A,world.C);x=2*half*ab/(ab+ac);}
 if(type==='height')x=a;
 const footName=type==='height'?'H':type==='bisector'?'L':'M';world[footName]={x,y:0};
 const segments=[S('AB','A','B'),S('AC','A','C'),S('BC','B','C'),S('cevian','A',footName)];
 if(type==='median')segments.push(S('BM','B','M',{marks:1}),S('MC','M','C',{marks:1}));
 if(type==='height'&&x<0)segments.push(S('extension','H','B',{dashed:true}));
 const angles=type==='height'?[A('right','H','A','C',{right:true,marks:1})]:type==='bisector'?[A('BAL','A','B','L',{marks:1}),A('LAC','A','L','C',{marks:1})]:[];
 return {d:D('Отрезок проведён из вершины A к противоположной стороне или содержащей её прямой.',project(world,n),segments,angles),world,half,h,footName,type};
}
function iso(n,baseAngle=30+n%51){
 const b=4+Math.floor(n/6)%6,h=b*Math.tan(rad(baseAngle)),world={A:{x:0,y:h},B:{x:-b,y:0},C:{x:b,y:0},M:{x:0,y:0}};
 const points=project(world,n);delete points.M;
 return {d:D('AB = AC; BC — основание. Другие равенства нужно обосновать.',points,[S('AB','A','B',{marks:1}),S('AC','A','C',{marks:1}),S('BC','B','C')]),world,b,h,baseAngle};
}
function circle(n,kind='elements'){
 const radius=100,rotation=rad((n%12)*15),theta=rad(40+Math.floor(n/12)*10),O=P(300,185,0,24);
 const at=t=>P(O.x+radius*Math.cos(t),O.y-radius*Math.sin(t),Math.cos(t)*19,-Math.sin(t)*20);
 const points={O,A:at(rotation),B:at(rotation+theta),C:at(rotation+Math.PI)};
 const segments=[S('OA','O','A'),S('OB','O','B'),S('AC','A','C'),S('AB','A','B')];
 if(kind==='chords'){points.D=at(rotation+theta+Math.PI);segments.push(S('BD','B','D'),S('CD','C','D'));}
 return {d:D('Точки A, B и C лежат на окружности с центром O.'+(kind==='chords'?' Точка D также на окружности; AC и BD — диаметры.':''),points,segments,[],{circles:[{id:'circle',center:'O',radius}]}),radius,rotation,theta};
}

reg('triangle-included-angle','Угол между двумя сторонами',6,'Две выбранные стороны встречаются в вершине угла между ними.',[],n=>{
 const g=pair(n,'none'),i=n%3,vertices=['A','B','C'],v=vertices[i],others=vertices.filter(x=>x!==v),angle=others[0]+v+others[1],q=`В треугольнике ABC даны стороны ${v+others[0]} и ${v+others[1]}. Какой угол заключён между ними?`;
 g.d.segments.forEach(s=>{delete s.marks;});
 return finish(q,[C('Какая вершина общая у двух названных сторон?',[v,...others],n,'Общая буква в обозначениях сторон — их общая вершина.'),C('Назови угол между этими сторонами.',[angle,...vertices.filter(x=>x!==v).map(x=>vertices.filter(y=>y!==x)[0]+x+vertices.filter(y=>y!==x)[1])],n+1,`Лучи ${v+others[0]} и ${v+others[1]} образуют угол ∠${angle}. Буква ${v} стоит в середине.`,['','Сначала найди общую вершину сторон.','Угол между сторонами должен опираться именно на обе названные стороны.'])],g.d,{kind:'included',vertex:v,sides:[v+others[0],v+others[1]],targetAngle:angle});
});
reg('triangle-common-side','Общая сторона',6,'Общий отрезок равен самому себе; это отдельное основание.',[],n=>{
 const g=kite(n),q='Треугольники ABC и ADC имеют общую сторону. Как обосновать равенство AC = AC?';
 return finish(q,[C('Какая сторона входит в оба треугольника?',['AC','AB','CD'],n,'Оба треугольника содержат точки A и C и соединяющий их отрезок.'),C('Почему AC = AC?',['Это один и тот же отрезок, общая сторона.','Потому что треугольники уже признаны равными.','Потому что стороны похожи на рисунке.'],n+1,'Отрезок равен самому себе. Равенство треугольников ещё предстоит доказать.',['','Это круг в доказательстве: равенство треугольников пока не доказано.','Вид чертежа не является основанием.'])],g.d,{kind:'common',triangles:['ABC','ADC'],common:'AC'});
});
reg('triangle-vertical-angle','Вертикальные углы в доказательстве',6,'Противоположные лучи образуют вертикальные углы; они равны.',['triangle-included-angle'],n=>{
 const g=cross(n),q=`Прямые AC и BD пересекаются в O; ∠AOB = ${g.beta}°. Чему равен ∠COD?`;
 g.d.angles.push(A('given','O','A','B',{label:g.beta+'°'}));
 return finish(q,[C('Как связаны углы AOB и COD?',['Они вертикальные.','Они смежные.','Они равны только после доказательства равенства треугольников.'],n,'OA и OC — противоположные лучи, как и OB и OD. Поэтому углы вертикальные.'),N('Найди ∠COD в градусах.',g.beta,`Вертикальные углы равны: ∠COD = ∠AOB = ${g.beta}°.`,{[180-g.beta]:'180° минус данный угол даёт смежный угол, а здесь угол вертикальный.'})],g.d,{kind:'vertical',givenAngle:g.beta,angle:['C','O','D']});
});
reg('triangle-proof-correspondence','Соответствующие вершины',6,'Порядок букв фиксирует пары равных сторон и углов.',['triangle-included-angle'],n=>{
 const g=pair(n),targets=['ABC','ACB','BAC','BCA','CAB','CBA'],left=targets[n%6],map={A:'D',B:'E',C:'F'},right=[...left].map(x=>map[x]).join(''),v=left[0],q=`Дано: AB = DE, AC = DF, ∠BAC = ∠EDF. Заверши запись равенства △${left} = △… с верным порядком вершин.`;
 return finish(q,[C(`Какой вершине соответствует ${v}?`,[map[v],...['D','E','F'].filter(x=>x!==map[v])],n,'Общий конец данных сторон A соответствует D; далее B соответствует E, C соответствует F.'),C('Выбери правильный порядок букв второго треугольника.',[right,right[1]+right[0]+right[2],right[0]+right[2]+right[1]],n+1,`Соответствие A↔D, B↔E, C↔F сохраняется в любом порядке записи: △${left} = △${right}.`)],g.d,{kind:'correspondence',left,map});
});
reg('triangle-proof-reasons','Причина каждого равенства',6,'Различай условие, общую сторону и свойство вертикальных углов.',['triangle-common-side','triangle-vertical-angle'],n=>{
 const crossMode=n%2===0,g=crossMode?cross(n):kite(n),given=crossMode?'AO = OC':'AB = AD',derived=crossMode?'∠AOB = ∠COD':'AC = AC',reason=crossMode?'Вертикальные углы равны.':'Общая сторона равна самой себе.',q=`Для доказательства получено ${derived}. Какое основание нужно записать рядом?`;
 return finish(q,[C(`Откуда известно ${given}?`,['Из условия и одинаковых засечек.','Из уже доказанного равенства треугольников.','Из измерения картинки.'],n,'Данные равенства можно использовать сразу.'),C(`Обоснуй ${derived}.`,[reason,'Это следует из равенства треугольников, которое ещё доказывается.','На экране элементы кажутся одинаковыми.'],n+1,reason+' Это основание не зависит от будущего вывода о треугольниках.')],g.d,{kind:'reason',reasonMode:crossMode?'vertical':'common'});
});
reg('triangle-sas-common','Первый признак и общая сторона',6,'Две стороны и угол между ними дают первый признак.',['triangle-common-side','triangle-included-angle'],n=>{
 const g=kite(n),q='Дано AB = AD и ∠BAC = ∠CAD. Выбери полное доказательство равенства △ABC и △ADC.';
 return finish(q,[C('Какое ещё равенство сторон нужно использовать?',['AC = AC: общая сторона.','BC = CD: они выглядят одинаково.','AB = AC: у сторон есть общая вершина.'],n,'AC входит в оба треугольника и равна самой себе.'),C('Выбери полное доказательство.',[
 'AB = AD по условию; AC = AC — общая сторона; ∠BAC = ∠CAD по условию, эти углы между указанными сторонами. Поэтому △ABC = △ADC по первому признаку.',
 'AB = AD, AC = AC. Двух пар равных сторон достаточно для равенства треугольников.',
 'Сначала BC = CD, потому что треугольники равны; поэтому треугольники равны по трём сторонам.'
 ],n+1,'В каждом треугольнике указаны две стороны и заключённый между ними угол. Все три основания получены до вывода.',['','Не хватает угла между сторонами.','Здесь вывод используется как собственное основание.'])],g.d,{kind:'proof',criterion:'SAS',configuration:'common'});
});
reg('triangle-sas-cross','Первый признак при пересечении',6,'Равенство углов иногда нужно получить до применения признака.',['triangle-vertical-angle','triangle-proof-correspondence'],n=>{
 const g=cross(n),q='Прямые AC и BD пересекаются в O; AO = OC, BO = OD. Выбери полное доказательство △AOB = △COD.';
 return finish(q,[C('Как получить равенство включённых углов?',['∠AOB = ∠COD как вертикальные.','∠AOB = ∠COD как смежные.','∠AOB = ∠COD, потому что треугольники уже равны.'],n,'Вертикальные углы дают нужное основание независимо от треугольников.'),C('Выбери полное доказательство.',[
 'AO = OC и BO = OD по условию. ∠AOB = ∠COD как вертикальные; это углы между данными сторонами. Значит, △AOB = △COD по первому признаку.',
 'AO = OC и BO = OD. Любые две пары равных сторон делают треугольники равными.',
 'AO = OC, BO = OD, а ∠AOB и ∠COD в сумме дают 180°. Поэтому треугольники равны по первому признаку.'
 ],n+1,'Нужны две пары сторон и равные углы между ними. Вертикальные углы обеспечивают третье условие.')],g.d,{kind:'proof',criterion:'SAS',configuration:'cross'});
});
reg('triangle-sas-insufficient','Когда первый признак неприменим',6,'Две стороны и угол, не заключённый между ними, не составляют признак равенства.',['triangle-included-angle'],n=>{
 const g=pair(n,'none'),caseId=n%2;
 g.d.segments.forEach(s=>{delete s.marks;});
 const sidePairs=caseId?'AB = DE и BC = EF':'AB = DE и AC = DF',anglePair=caseId?'∠BAC = ∠EDF':'∠ABC = ∠DEF',needed=caseId?'∠ABC = ∠DEF':'∠BAC = ∠EDF';
 const sides=caseId?['AB','BC','DE','EF']:['AB','AC','DE','DF'];sides.forEach((id,i)=>{g.d.segments.find(s=>s.id===id).marks=i%2+1;});
 const av=caseId?'A':'B',bv=caseId?'D':'E';g.d.angles.push(A('given1',av,caseId?'B':'A','C',{marks:1}),A('given2',bv,caseId?'E':'D','F',{marks:1}));
 const q=`Известны только ${sidePairs} и ${anglePair}. Какого равенства углов не хватает для прямого применения первого признака к указанным сторонам?`;
 return finish(q,[C('Данный равный угол находится между двумя данными сторонами?',['Нет, он прилежит только к одной из них.','Да, любой угол подходит.','Да, если треугольники одинаково повёрнуты.'],n,'Проверь общую вершину двух названных сторон. Данный угол имеет другую вершину.'),C('Какое равенство обеспечит углы между этими сторонами?',[needed,anglePair,'Дополнительное условие не нужно.'],n+1,`Нужно ${needed}. Без него перечисленные данные не позволяют непосредственно применить первый признак; внешний вид чертежа не заменяет условие.`,['','Это уже дано, но угол не включён между выбранными сторонами.','Две стороны и не включённый между ними угол не составляют первый признак.'])],g.d,{kind:'insufficient',caseId,requiredAngle:needed});
});

reg('triangle-median','Медиана и половина стороны',7,'Медиана соединяет вершину с серединой противоположной стороны.',[],n=>{
 const g=cevian(n,'median'),whole=n%2===0,q=whole?`AM — медиана △ABC; BC = ${g.half*2} см. Найди BM в сантиметрах.`:`AM — медиана △ABC; BM = ${g.half} см. Найди BC в сантиметрах.`;
 return finish(q,[C('Что следует из того, что AM — медиана?',['BM = MC: M — середина BC.','AM перпендикулярна BC.','∠BAM = ∠MAC.'],n,'Медиана делит противоположную сторону пополам. Равенство углов и перпендикулярность в произвольном треугольнике не следуют.'),N(whole?'Найди BM.':'Найди BC.',whole?g.half:2*g.half,whole?`BM = BC : 2 = ${g.half} см.`:`BC = BM + MC = ${2*g.half} см.`)],g.d,{kind:'median',half:g.half,query:whole?'half':'whole'});
});
reg('triangle-bisector','Биссектриса и половина угла',7,'Биссектриса делит угол при вершине на два равных угла.',[],n=>{
 const halfAngle=18+n%43,ab=5+n%7,ac=6+Math.floor(n/7)%5,t=rad(2*halfAngle),world={A:{x:0,y:0},B:{x:ab,y:0},C:{x:ac*Math.cos(t),y:ac*Math.sin(t)}};
 world.L={x:(ac*world.B.x+ab*world.C.x)/(ab+ac),y:(ac*world.B.y+ab*world.C.y)/(ab+ac)};
 const d=D('AL — биссектриса угла BAC. Равенство BL и LC не дано.',project(world,n),[S('AB','A','B'),S('AC','A','C'),S('BC','B','C'),S('AL','A','L')],[A('BAL','A','B','L',{marks:1}),A('LAC','A','L','C',{marks:1})]);
 const whole=n%2===0,q=whole?`AL — биссектриса; ∠BAC = ${2*halfAngle}°. Найди ∠BAL.`:`AL — биссектриса; ∠BAL = ${halfAngle}°. Найди ∠BAC.`;
 return finish(q,[C('Какое равенство даёт биссектриса?',['∠BAL = ∠LAC.','BL = LC.','AL = BC.'],n,'Биссектриса делит угол, а не обязательно противоположную сторону.'),N(whole?'Найди ∠BAL в градусах.':'Найди ∠BAC в градусах.',whole?halfAngle:2*halfAngle,whole?`Каждая часть угла равна ${2*halfAngle}° : 2 = ${halfAngle}°.`:`Весь угол равен ${halfAngle}° + ${halfAngle}° = ${2*halfAngle}°.`)],d,{kind:'bisector',halfAngle,query:whole?'half':'whole'});
});
reg('triangle-altitude','Высота внутри и вне',7,'Высота идёт из вершины перпендикулярно прямой противоположной стороны.',[],n=>{
 const g=cevian(n,'height'),outside=g.world.H.x<0,q='В треугольнике ABC точка H лежит на прямой BC, а AH проведена из вершины A перпендикулярно этой прямой. Как правильно назвать AH и объяснить ответ?';
 return finish(q,[N('Чему равен угол AHC в градусах?',90,'Перпендикулярные прямые образуют прямой угол, равный 90°.'),C('Выбери определение, подходящее к AH.',[
 outside?'AH — высота; её основание H лежит на продолжении стороны BC.':'AH — высота; она проведена из вершины A перпендикулярно прямой BC.',
 'AH — медиана, потому что пересекает прямую BC.',
 outside?'AH не может быть высотой, поскольку H лежит вне стороны BC.':'AH — биссектриса, потому что идёт из вершины A.'
 ],n,'В определении высоты важны вершина и перпендикулярность прямой противоположной стороны. Основание может лежать вне стороны.')],g.d,{kind:'height',outside,foot:g.world.H.x,base:[0,2*g.half]});
});
reg('triangle-cevian-choice','Медиана, биссектриса или высота',7,'Название отрезка определяется данным свойством, а не его видом.',['triangle-median','triangle-bisector','triangle-altitude'],n=>{
 const mode=['median','bisector','height'][n%3],g=cevian(n,mode),name={median:'медиана',bisector:'биссектриса',height:'высота'}[mode],fact={median:'BM = MC',bisector:'∠BAL = ∠LAC',height:'AH ⟂ BC'}[mode],q=`В △ABC дано ${fact}; ${g.footName} лежит на прямой BC${mode==='height'?'':', между B и C'}. Как называется отрезок A${g.footName} по этому условию?`;
 return finish(q,[C('На какое свойство нужно опереться?',[{median:'Середина противоположной стороны.',bisector:'Деление угла при A пополам.',height:'Перпендикулярность прямой противоположной стороны.'}[mode],'Похожесть на вертикальную линию.','Близость точки к центру рисунка.'],n,'Используй явно данное геометрическое свойство.'),C(`Назови A${g.footName}.`,[name,...['медиана','биссектриса','высота'].filter(x=>x!==name)],n+1,`Из условия ${fact} следует, что A${g.footName} — ${name}. В произвольном треугольнике остальные свойства не предполагаются.`)],g.d,{kind:'cevian',mode});
});

reg('triangle-isosceles-base','Основание равнобедренного треугольника',8,'Основание лежит напротив вершины, где встречаются равные боковые стороны.',[],n=>{
 const g=iso(n),perm=['ABC','BCA','CAB'][n%3],rename={A:perm[0],B:perm[1],C:perm[2]},points={};Object.entries(g.d.points).forEach(([k,p])=>{points[rename[k]]=p;});g.d.points=points;g.d.segments=g.d.segments.map(s=>({...s,id:rename[s.from]+rename[s.to],from:rename[s.from],to:rename[s.to]}));
 const [apex,b,c]=perm,base=b+c,q=`В треугольнике ${perm} равны стороны ${apex+b} и ${apex+c}. Какая сторона является основанием?`;
 g.d.description=`${apex+b} = ${apex+c}. Другие равенства нужно обосновать.`;
 return finish(q,[C('В какой вершине встречаются равные боковые стороны?',[apex,b,c],n,'Найди общую вершину двух равных сторон.'),C('Выбери основание.',[base,apex+b,apex+c],n+1,`Основание ${base} лежит напротив вершины ${apex}; оно не входит в указанную пару боковых сторон.`)],g.d,{kind:'iso-base',apex,base});
});
reg('triangle-isosceles-angle','Равные углы при основании',8,'У равнобедренного треугольника равны именно углы при основании.',['triangle-isosceles-base'],n=>{
 const beta=28+n%48,g=iso(n,beta),external=n%2===1;
 let given=beta;if(external){given=180-beta;g.world.E={x:-g.b*2,y:0};g.d.points=project(g.world,n);delete g.d.points.M;g.d.segments.push(S('BE','B','E',{dashed:true}));g.d.angles.push(A('external','B','E','A',{label:given+'°'}));}else g.d.angles.push(A('given','B','A','C',{label:beta+'°'}));
 const q=external?`AB = AC; BE — продолжение CB за B, ∠EBA = ${given}°. Найди ∠BCA.`:`AB = AC; ∠ABC = ${beta}°. Найди ∠BCA.`;
 return finish(q,[external?N('Найди внутренний угол ABC в градусах.',beta,`Смежные углы дают 180°: ∠ABC = 180° − ${given}° = ${beta}°.`):C('Какие углы равны по свойству равнобедренного треугольника?',['∠ABC и ∠BCA.','∠BAC и ∠ABC.','Все три угла обязательно равны.'],n,'Равны углы при основании BC, то есть углы B и C.'),N('Найди ∠BCA в градусах.',beta,`AB = AC, поэтому углы при основании BC равны: ∠BCA = ∠ABC = ${beta}°.`)],g.d,{kind:'iso-angle',baseAngle:beta,given,external});
});
reg('triangle-isosceles-cevian','Три свойства отрезка к основанию',8,'Медиана, высота или биссектриса из вершины между равными сторонами к основанию имеет все три свойства.',['triangle-isosceles-base','triangle-cevian-choice','triangle-sas-common'],n=>{
 const g=iso(n),mode=['median','bisector','height'][n%3];g.d.points=project(g.world,n);g.d.segments.push(S('AM','A','M'));
 if(mode==='median')g.d.segments.push(S('BM','B','M',{marks:2}),S('MC','M','C',{marks:2}));
 if(mode==='bisector')g.d.angles.push(A('BAM','A','B','M',{marks:1}),A('MAC','A','M','C',{marks:1}));
 if(mode==='height')g.d.angles.push(A('right','M','A','C',{marks:1,right:true}));
 const word={median:'медиана',bisector:'биссектриса',height:'высота'}[mode],conclusion={median:'AM ⟂ BC и ∠BAM = ∠MAC.',bisector:'BM = MC и AM ⟂ BC.',height:'BM = MC и ∠BAM = ∠MAC.'}[mode],q=`AB = AC; AM — ${word}, проведённая к основанию BC. Какие ещё два свойства AM следуют из этого?`;
 return finish(q,[C('Почему здесь применимо особое свойство равнобедренного треугольника?',['AM идёт из вершины между равными сторонами к основанию BC.','Любая медиана любого треугольника перпендикулярна стороне.','У каждого треугольника все такие отрезки совпадают.'],n,'Медиана, биссектриса или высота из вершины между равными сторонами к основанию равнобедренного треугольника имеет остальные два свойства.'),C('Выбери два следствия.',[conclusion,'AB = BC и AC = BC.','AM = BC и ∠ABC = 90°.'],n+1,`AM одновременно медиана, биссектриса и высота к основанию. Поэтому ${conclusion}`)],g.d,{kind:'iso-cevian',mode});
});

reg('triangle-asa-adjacent','Углы прилежащие к стороне',9,'К стороне прилежат два угла при её концах.',['triangle-included-angle'],n=>{
 const g=pair(n,'none'),side=['AB','BC','AC'][n%3],angles={A:'BAC',B:'ABC',C:'ACB'},correct=`∠${angles[side[0]]} и ∠${angles[side[1]]}`,other='ABC'.split('').find(x=>!side.includes(x));g.d.segments.forEach(s=>{delete s.marks;});
 const q=`В △ABC выбрана сторона ${side}. Какая пара углов прилежит к этой стороне?`;
 return finish(q,[C('Какие вершины являются концами выбранной стороны?',[side,side[0]+other,side[1]+other],n,'Углы, прилежащие к стороне, имеют вершины в её концах.'),C('Выбери пару прилежащих углов.',[correct,`∠${angles[side[0]]} и ∠${angles[other]}`,`∠${angles[side[1]]} и ∠${angles[other]}`],n+1,`У стороны ${side} концы ${side[0]} и ${side[1]}, поэтому к ней прилежат ${correct}.`)],g.d,{kind:'asa-adjacent',side});
});
reg('triangle-asa-proof','Доказательство по второму признаку',9,'Одна сторона и два прилежащих к ней угла дают второй признак.',['triangle-asa-adjacent','triangle-proof-correspondence'],n=>{
 const g=pair(n,'asa'),q='Дано AB = DE, ∠BAC = ∠EDF, ∠ABC = ∠DEF. Выбери полное доказательство △ABC = △DEF.';
 return finish(q,[C('К какой паре равных сторон прилежат обе пары данных углов?',['AB и DE.','AC и DF.','BC и EF.'],n,'Углы при A и B прилежат к AB; углы при D и E — к DE.'),C('Выбери полное доказательство.',[
 'AB = DE; ∠BAC = ∠EDF и ∠ABC = ∠DEF по условию. Эти углы прилежат соответственно к AB и DE. Поэтому △ABC = △DEF по второму признаку.',
 'Даны два равных угла, поэтому треугольники равны без какого-либо условия о сторонах.',
 'AB = DE и углы при A и D равны. Одна сторона и один угол дают первый признак.'
 ],n+1,'Все три условия второго признака явно указаны: сторона и два прилежащих угла.')],g.d,{kind:'proof',criterion:'ASA',configuration:'pair'});
});
reg('triangle-asa-consequence','Следствие второго признака',9,'После доказательства равенства можно приравнять соответствующие элементы.',['triangle-asa-proof'],n=>{
 const g=pair(n,'asa'),length=g.b,q=`AB = DE, ∠BAC = ∠EDF, ∠ABC = ∠DEF. Дополнительно AC = ${length} см. Найди DF в сантиметрах.`;
 return finish(q,[C('Какое равенство треугольников даёт второй признак?',['△ABC = △DEF.','△ABC = △DFE.','Двух углов и прилежащей к ним стороны никогда не достаточно.'],n,'Соответствие A↔D, B↔E, C↔F задают данные сторона и углы.'),N('Найди DF.',length,`После доказанного равенства соответствующие стороны AC и DF равны. Поэтому DF = ${length} см.`)],g.d,{kind:'asa-consequence',givenLength:length,correspondingSides:['AC','DF']});
});

reg('triangle-sss-proof','Доказательство по трём сторонам',10,'Три пары равных сторон дают третий признак без дополнительного условия об углах.',['triangle-common-side'],n=>{
 const common=n%2===0,g=common?kite(n,'sss'):pair(n,'sss'),given=common?'AB = AD и BC = CD':'AB = DE, AC = DF и BC = EF',q=`Дано ${given}. Выбери полное доказательство равенства ${common?'△ABC и △ADC':'△ABC и △DEF'}.`,proof=common?'AB = AD и BC = CD по условию; AC = AC — общая сторона. Три пары сторон равны, поэтому △ABC = △ADC по третьему признаку.':'AB = DE, AC = DF, BC = EF по условию. Три пары сторон равны, поэтому △ABC = △DEF по третьему признаку.';
 return finish(q,[C('Какие данные доступны до доказательства?',['Три пары равных сторон, включая общую сторону, если она есть.','Две стороны и равный угол между ними обязательно даны.','Все углы уже равны, потому что так выглядит чертёж.'],n,'Назови три пары сторон. Равные углы пока не даны и не нужны для третьего признака.'),C('Выбери полное доказательство.',[proof,'Три стороны равны, следовательно, треугольники равны по первому признаку.','Сначала заключим, что углы равны, поскольку треугольники равны; затем применим первый признак.'],n+1,'Три стороны — третий признак. Первый признак требует равенства угла между двумя сторонами как отдельного обоснованного условия.',['','Первый признак — две стороны и угол между ними, а не три стороны.','Нельзя обосновывать нужные углы ещё не доказанным равенством треугольников.'])],g.d,{kind:'proof',criterion:'SSS',configuration:common?'common':'pair'});
});
reg('triangle-congruence-choice','Первый, второй или третий признак',10,'Выбирай признак по имеющимся данным, не по форме рисунка.',['triangle-sas-common','triangle-asa-proof','triangle-sss-proof'],n=>{
 const mode=['sas','asa','sss'][n%3],g=pair(n,mode),conditions={sas:'AB = DE, AC = DF, ∠BAC = ∠EDF',asa:'AB = DE, ∠BAC = ∠EDF, ∠ABC = ∠DEF',sss:'AB = DE, AC = DF, BC = EF'}[mode],labels={sas:'Первый: две стороны и угол между ними.',asa:'Второй: сторона и два прилежащих угла.',sss:'Третий: три стороны.'},facts={sas:'Две пары сторон и включённые между ними углы.',asa:'Одна пара сторон и две пары прилежащих углов.',sss:'Три пары сторон; равенство углов не дано.'},q=`Известно: ${conditions}. Какой признак непосредственно доказывает △ABC = △DEF?`;
 return finish(q,[C('Опиши набор данных.',[facts[mode],...Object.entries(facts).filter(([k])=>k!==mode).map(([,v])=>v)],n,facts[mode]),C('Выбери признак.',[labels[mode],...Object.entries(labels).filter(([k])=>k!==mode).map(([,v])=>v)],n+1,labels[mode]+' Именно этот набор условий дан до доказательства.')],g.d,{kind:'criterion',criterion:mode.toUpperCase()});
});
reg('triangle-congruence-consequence','Равные элементы после доказательства',10,'Сначала докажи равенство треугольников, затем используй правильное соответствие.',['triangle-sss-proof','triangle-proof-correspondence'],n=>{
 const g=kite(n,'sss'),q='AB = AD и BC = CD. После доказательства △ABC = △ADC какое равенство углов следует из соответствия вершин?';
 const target=n%2===0?'∠ABC = ∠ADC.':'∠BCA = ∠DCA.';
 return finish(q,[C('Как доказать равенство треугольников?',['AB = AD, BC = CD, AC = AC; третий признак.','Достаточно только AB = AD.','Углы равны на вид, поэтому первый признак.'],n,'AC — общая третья сторона, поэтому применим третий признак.'),C('Выбери верное равенство соответствующих углов.',[target,'∠BAC = ∠ADC.','∠ABC = ∠DAC.'],n+1,'В записи △ABC = △ADC вершины соответствуют так: A↔A, B↔D, C↔C. Стороны угла должны переходить в соответствующие стороны.')],g.d,{kind:'consequence',targetAngle:target,triangles:['ABC','ADC']});
});

reg('circle-elements','Радиус, диаметр, хорда и дуга',11,'Диаметр является хордой через центр; дуга — часть самой окружности.',[],n=>{
 const g=circle(n),mode=n%4,item=['OA','AC','AB','дуга от A до B'][mode],names=['Радиус.','Диаметр (он также является хордой).','Хорда, не проходящая через центр.','Дуга.'],fact=['Один конец — центр O, другой — точка окружности.','Оба конца на окружности, отрезок проходит через O.','Оба конца на окружности, отрезок не проходит через O.','Это часть окружности, а не прямой отрезок.'][mode],q=mode===3?'Как называется часть окружности от A до B вдоль окружности?':`Как наиболее точно называется отрезок ${item} на данном чертеже?`;
 return finish(q,[C('Какое описание относится к названному элементу?',[fact,...['Это прямая, не имеющая концов.','Все его точки совпадают с центром O.']],n,fact),C('Выбери точное название.',[names[mode],...names.filter((_,i)=>i!==mode)],n+1,names[mode]+' '+fact)],g.d,{kind:'circle-element',mode,item});
});
reg('circle-radius-diameter','Связь радиуса и диаметра',11,'Диаметр состоит из двух радиусов одной окружности.',['circle-elements'],n=>{
 const g=circle(n),r=3+n%22,givenDiameter=n%2===0,q=givenDiameter?`AC — диаметр окружности с центром O; AC = ${2*r} см. Найди OB в сантиметрах.`:`OA = ${r} см — радиус окружности. AC — диаметр. Найди AC в сантиметрах.`;
 return finish(q,[C('Какая связь верна?',['AC = 2 · OA и OA = OB.','AC = OA, поскольку оба отрезка принадлежат кругу.','OB = AC + OA.'],n,'OA и OC — два равных радиуса; AC = OA + OC. Все радиусы одной окружности равны.'),N(givenDiameter?'Найди OB.':'Найди AC.',givenDiameter?r:2*r,givenDiameter?`OB = AC : 2 = ${r} см.`:`AC = 2 · OA = ${2*r} см.`)],g.d,{kind:'radius-diameter',radius:r,query:givenDiameter?'radius':'diameter'});
});
reg('circle-isosceles','Равнобедренный треугольник из радиусов',11,'Два радиуса одной окружности — равные стороны треугольника.',['circle-elements','triangle-isosceles-angle'],n=>{
 const beta=22+n%54,theta=rad(180-2*beta),rotation=rad(Math.floor(n/12)*20),radius=100,O=P(300,185,0,24),at=t=>P(O.x+radius*Math.cos(t),O.y-radius*Math.sin(t),Math.cos(t)*18,-Math.sin(t)*21),points={O,A:at(rotation),B:at(rotation+theta)},d=D('A и B лежат на окружности с центром O. OA и OB — радиусы.',points,[S('OA','O','A'),S('OB','O','B'),S('AB','A','B')],[A('given','A','O','B',{label:beta+'°'})],{circles:[{id:'circle',center:'O',radius}]}),q=`A и B — точки окружности с центром O; ∠OAB = ${beta}°. Найди ∠ABO.`;
 return finish(q,[C('Почему △OAB равнобедренный?',['OA = OB как радиусы одной окружности.','Любая хорда равна радиусу.','Точки A и B находятся на одной горизонтали.'],n,'Радиусы одной окружности равны, поэтому OA и OB — равные боковые стороны.'),N('Найди ∠ABO в градусах.',beta,`В равнобедренном △OAB углы при основании AB равны: ∠ABO = ∠OAB = ${beta}°.`)],d,{kind:'circle-iso',baseAngle:beta});
});
reg('circle-congruent-chords','Равные хорды через первый признак',11,'Радиусы и вертикальные центральные углы дают равенство треугольников, затем хорд.',['circle-elements','triangle-sas-cross','triangle-congruence-consequence'],n=>{
 const g=circle(n,'chords'),q='AC и BD — диаметры одной окружности с центром O. Выбери полное доказательство равенства хорд AB и CD.';
 return finish(q,[C('Какие три условия позволяют сравнить △AOB и △COD?',['OA = OC, OB = OD как радиусы; ∠AOB = ∠COD как вертикальные.','AB = CD по виду рисунка; этого достаточно.','OA = OB; одной пары сторон достаточно.'],n,'Радиусы дают две пары равных сторон, а пересекающиеся диаметры — вертикальные углы между ними.'),C('Выбери полное доказательство.',[
 'OA = OC и OB = OD как радиусы одной окружности. ∠AOB = ∠COD как вертикальные. Значит, △AOB = △COD по первому признаку, а AB = CD как соответствующие стороны равных треугольников.',
 'AB и CD — хорды одной окружности, поэтому они всегда равны.',
 'AB = CD, поскольку треугольники равны; треугольники равны, поскольку AB = CD.'
 ],n+1,'Сначала обосновываем равенство треугольников по двум сторонам и углу между ними, затем равенство соответствующих хорд.',['','Разные хорды одной окружности могут иметь разную длину.','Это круговое рассуждение: искомое равенство использовано как основание.'])],g.d,{kind:'proof',criterion:'SAS',configuration:'circle'});
});
})(typeof window==='undefined'?globalThis:window);
