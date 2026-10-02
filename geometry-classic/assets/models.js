(function(root){'use strict';
const G=root.GeoMath;
function point(id,x,y,extra={}){return {id,x,y,kind:'free',...extra};}
function line(a,b,extent='segment'){return {id:a+b,type:'line',extent,a,b};}
function chain(labels,ks,{lineExtent='segment',midpoints=[]}={}){const first=labels[0],last=labels.at(-1);let ps=[point(first,75,230),point(last,560,230)];for(let i=1;i<labels.length-1;i++)ps.push(point(labels[i],0,0,{kind:'affine',a:first,b:last,k:ks[i]}));for(const [id,a,b] of midpoints)ps.push(point(id,0,0,{kind:'midpoint',a,b}));return {points:ps,objects:[line(first,last,lineExtent)]};}
function rays(angles){const ps=[point('O',310,230),point('R',490,230)];for(const [id,t] of Object.entries(angles))ps.push(point(id,0,0,{kind:'onCircle',a:'O',b:'R',t:-t*Math.PI/180}));return {points:ps,objects:Object.keys(angles).map(id=>line('O',id,'ray'))};}
function make(p){const n=p.number;let scene,description='Измени положение синих точек. Зелёные точки сохраняют заданные зависимости.',controls=[],measure=null,figure='segment';
 const S=(labels,ks,options)=>chain(labels,ks,options),A=x=>{figure='angle';return rays(x);};
 if(n===1||n===5){scene={points:[point('A',120,240),point('B',500,240)],objects:[line('A','B','line')]};description='Добавь точки инструментом «Точка». Для точек на прямой используй тот же уровень y. Объясни, каким буквам условия соответствуют созданные точки.';}
 else if(n===2||n===71){scene={points:[point('A',120,320),point('B',520,300),point('C',240,75),...(n===71?[point('D',450,100)]:[])],objects:[]};description='Проведи прямые через все пары исходных точек. Каждую прямую строй только один раз.';}
 else if(n===3||n===72){scene={points:[point('A',120,330),point('B',510,80),point('C',120,80),point('D',510,330),point('E',80,210),point('F',560,210,{kind:'affine',a:'E',b:'E',k:0})],objects:[line('A','B','line'),line('C','D','line')]};scene.points[5]=point('F',560,210);scene.objects.push(line('E','F','line'));if(n===72){scene.points.push(point('H',100,290),point('I',530,240));scene.objects.push(line('H','I','line'));}controls=[{label:'Высота третьей прямой',min:60,max:360,value:205,update:(b,v)=>{b.point('E').y=v;b.point('F').y=v;}}];description='Две наклонные прямые пересекаются. Двигай третью вверх и вниз. Инструментом «Пересечение» отметь общие точки каждой пары. Совпадающие точки считай один раз.';}
 else if(n===4){scene=S(['A','B','C'],[0,.5,1],{lineExtent:'line'});scene.points.push(point('D',270,80));scene.objects=[];description='Проведи прямые для каждой пары. AB, AC и BC должны оказаться одной и той же прямой.';}
 else if(n===6||n===8){scene=S(['A','C','B'],[0,.45,1],{lineExtent:'line'});}
 else if(n===7){scene=S(['A','B','C','D'],[0,.28,.58,1]);description='Проверь каждый отрезок по его концам. Точка принадлежит отрезку и на его границе.';}
 else if(n===18){scene=S(['O','B','A','C'],[0,.3,.66,1],{lineExtent:'ray'});}
 else if(n===19){scene=S(['A','O','B'],[0,.5,1]);}
 else if(n===20){scene=S(['A','B','C','D','E'],[0,.25,.5,.75,1]);}
 else if(n===26){scene={points:[],objects:[]};[['C','D',6],['E','F',5],['P','Q',3],['A','B',2],['K','L',1]].forEach(([a,b,k],i)=>{scene.points.push(point(a,90,70+65*i),point(b,90+65*k,70+65*i));scene.objects.push(line(a,b));});description='Здесь KL — один шаг, AB — два. При смене единицы физическая длина отрезков не меняется. Не измеряй картинку линейкой: используй число шагов.';}
 else if(n===27){scene=S(['O','Q','H','A','B'],[0,.125,.25,.5,1]);description='Схема отношений: OA — исходная длина, OB — удвоенная, OH — половина, OQ — четверть. На своём чертеже отложи длины от одного начала.';}
 else if(n===28){scene=S(['A','B','D','C'],[0,.5,.75,1]);}
 else if(n===29){scene=S(['C','A','D'],[0,.5,1],{lineExtent:'line'});description='C и D — две возможные точки: одна слева, другая справа от A. Расстояния до A одинаковы.';}
 else if([30,31,35,48,49,50,74].includes(n)){if(n>=48&&n<=50){let degrees=n===48?{A:78,C:48,B:0}:n===49?{A:155,C:70,B:0}:{A:108,B:27,C:0};scene=A(degrees);}else if(n===74){scene=S(['M','N','P'],[0,2/3,1]);}else{scene=S(['A','B','C'],[0,n===30?7.8/10.3:n===31?3.7/7.2:170/650,1]);}description='Выдели целое и две части. Изменение масштаба не меняет их отношения в показанной схеме.';}
 else if([32,33,38,75,79].includes(n)){let names=n===33?['D','B','M']:n===75?['L','K','M']:n===79?['A','B','C']:['B','A','C'];let lengths=n===32?[12,13.5]:n===33?[7,16]:n===75?[6,10]:[12,9];if(n===38)names=['O','A','B'];scene={points:[point(names[0],310,230),point(names[1],150,230),point(names[2],490,230)],objects:[line(names[0],names[1]),line(names[0],names[2])]};
 if(n===38||n===79){scene.points.push(point('M',0,0,{kind:'midpoint',a:names[0],b:names[1]}),point('N',0,0,{kind:'midpoint',a:names[0],b:names[2]}));scene.objects.push(line('M','N'));}
 const update=(b,v)=>{b.point(names[0]).x=310;b.point(names[1]).x=310+(v?1:-1)*lengths[0]*13;b.point(names[2]).x=310+lengths[1]*13;for(const id of names)b.point(id).y=230;};controls=[{label:'Расположение',choices:['По разные стороны','По одну сторону'],value:0,update}];description='Переключи оба расположения. Если общий конец между точками — складывай расстояния; если вне искомого отрезка — вычитай. Синие точки можно двигать и вручную: сохраняй коллинеарность.';}
 else if(n===34){scene=S(['A','D','C','B'],[0,17/64,.5,1]);}
 else if(n===36){scene={points:[point('A',100,290),point('B',100,110),point('C',340,110)],objects:[line('A','B'),line('B','C'),line('C','A')]};description='Один пример трёх неколлинеарных точек с длинами 3, 4, 5. Чертёж поддерживает вывод, но доказательство опирается на сумму длин.';}
 else if(n===37){scene=S(['A','D','C','B'],[0,.25,.5,1]);}
 else if(n===39){scene=S(['A','C','B'],[0,.35,1],{midpoints:[['M','A','C'],['N','C','B']]});scene.objects.push(line('M','N'));controls=[{label:'Положение точки деления C, % от AB',min:5,max:95,value:35,update:(b,v)=>b.point('C').k=v/100}];measure=b=>'MN / AB = '+(G.dist(b.point('M'),b.point('N'))/G.dist(b.point('A'),b.point('B'))).toFixed(3);description='Передвинь C ползунком. Следи за расстоянием между M и N. После опыта докажи, почему отношение равно 1/2.';}
 else if(n===40){scene=S(['A','P','Q','B'],[0,10/28,14/28,1],{midpoints:[['M','A','P'],['N','Q','B']]});scene.objects.push(line('M','N'));description='Показан один допустимый вариант: крайние части 10 и 14, средняя 4. Общее рассуждение в разборе не зависит от выбора крайних частей.';}
 else if(n===76){scene=S(['A','P','Q','B'],[0,.5,.75,1],{midpoints:[['M','A','P'],['N','Q','B']]});scene.objects.push(line('M','N'));}
 else if(n===77){scene=S(['A','P','Q','B'],[0,1/3,2/3,1],{midpoints:[['M','A','P'],['N','Q','B']]});controls=[{label:'Равные части',choices:['3 части','5 частей'],value:0,update:(b,v)=>{const k=v?5:3;b.point('P').k=1/k;b.point('Q').k=1-1/k;}}];measure=b=>'MN / AB = '+(G.dist(b.point('M'),b.point('N'))/G.dist(b.point('A'),b.point('B'))).toFixed(3);}
 else if(n===78){scene=S(['A','P','Q','R','B'],[0,4/36,13/36,28/36,1],{midpoints:[['M','A','P'],['N','R','B'],['H','P','Q'],['I','Q','R']]});scene.objects.push(line('M','N'),line('H','I'));description='Пример четырёх разных частей: 4, 9, 15, 8. Середины крайних M, N и средних H, I построены как зависимые точки. Докажи результат для любых допустимых частей.';}
 else if([9,10,11,12,13,14,15,16,17,21,22,23,41,42,43,44,45,46,47,51,52,53,54,55,56,58,59,60,61,62,63,64,65,66,67,68,73,80,81,82,83,84,85].includes(n)){
 let ang={A:0,B:70,C:35};
 if([10,54,55,58,59,60,61,63,82].includes(n))ang={A:180,B:0,C:65};
 if([15,56,64,65,66].includes(n))ang={A:0,B:60,C:180,D:240};
 if([11,14,21,47].includes(n))ang={A:110,B:0,C:45};
 if([16,17].includes(n))ang=n===16?{A:25,B:0,C:115,D:110,M:65,N:-10}:{A:40,B:0,H:10,L:25,K:-20,N:90,M:220};
 if(n===23)ang={A:125,B:100,C:75,D:50,E:25,F:0};
 if(n===42)ang={A:0,B:23,C:61,D:138};
 if(n===43)ang={A:0,B:70,C:35};
 if(n===44)ang={A:0,B:60,C:-60};
 if(n===46)ang={X:0,A:40,B:60,C:80,D:130,Z:180};
 if(n===51)ang={A:90,B:60,C:30,D:0,M:75,N:15};
 if(n===52)ang={X:0,U:30,Y:60,V:110,Z:160};
 if(n===62)ang={A:180,B:0,C:148,D:74};
 if([67,73].includes(n))ang={A:0,B:35,C:130,D:180,E:215,F:310};
 if(n===68)ang={A:140,B:90,C:20,D:320,E:270,F:200};
 if(n===80)ang={A:35,B:0,C:-50};
 if(n===81)ang={H:0,K:120,M:150};
 if(n===83||n===85)ang={A:180,B:0,C:70,M:125,N:35};
 if(n===84)ang={A:0,B:60,C:180,D:240,M:30,N:210};
 scene=A(ang);
 if(n===16){scene.objects=scene.objects.filter(o=>['B','D'].includes(o.b));description='Стороны угла — OB и OD. Остальные точки показывают внутреннюю и внешнюю области.';}
 if([22,43,53].includes(n)){controls=[{label:'Весь угол, градусов',min:10,max:170,value:n===43?70:90,update:(b,v)=>{b.point('B').t=-v*Math.PI/180;b.point('C').t=-v*Math.PI/360;}}];}
 if(n===44){controls=[{label:'∠AOB, градусов',min:10,max:170,value:60,update:(b,v)=>{b.point('B').t=-v*Math.PI/180;b.point('C').t=v*Math.PI/180;}}];measure=b=>{const v=Math.abs(b.point('B').t*180/Math.PI);return v<=90?'OA делит угол BOC пополам; ∠BOC = '+(2*v).toFixed(0)+'°':'2·∠AOB = '+(2*v).toFixed(0)+'° > 180°. OA лежит вне меньшего угла BOC; нужная биссектриса не получилась.';};}
 if([54,55,58,59,60,61,63,82].includes(n)){controls=[{label:'Одна часть развёрнутого угла, градусов',min:5,max:175,value:65,update:(b,v)=>b.point('C').t=-v*Math.PI/180}];measure=b=>{const a=-b.point('C').t*180/Math.PI;return '∠BOC = '+a.toFixed(0)+'°; ∠COA = '+(180-a).toFixed(0)+'°; сумма 180°.';};}
 if([15,56,64,65,66,84].includes(n)){controls=[{label:'Угол между прямыми, градусов',min:15,max:165,value:60,update:(b,v)=>{b.point('B').t=-v*Math.PI/180;b.point('D').t=-(v+180)*Math.PI/180;if(b.point('M')){b.point('M').t=-v*Math.PI/360;b.point('N').t=-(v/2+180)*Math.PI/180;}}}];measure=b=>{const a=-b.point('B').t*180/Math.PI;return 'Вертикальные пары: ∠AOB = ∠COD = '+a.toFixed(0)+'°; ∠BOC = ∠DOA = '+(180-a).toFixed(0)+'°.';};}
 if(n===80||n===81){controls=[{label:'Положение относительно общего луча',choices:['По одну сторону','По разные стороны'],value:n===80?1:0,update:(b,v)=>{const id=n===80?'C':'M',a=n===80?50:150;b.point(id).t=(v?1:-1)*a*Math.PI/180;}}];measure=b=>{const ids=n===80?['A','O','C']:['K','O','M'];return 'Искомый меньший угол: '+G.angle(...ids.map(x=>b.point(x))).toFixed(0)+'°.';};}
 if(n===83||n===85){controls=[{label:'∠BOC, градусов',min:10,max:170,value:70,update:(b,v)=>{b.point('C').t=-v*Math.PI/180;b.point('M').t=-(v+180)*Math.PI/360;b.point('N').t=-v*Math.PI/360;}}];measure=b=>'Биссектрисы OM и ON: угол между ними '+G.angle(b.point('M'),b.point('O'),b.point('N')).toFixed(0)+'°.';}
 if([9,12,13,41].includes(n)){scene.objects=scene.objects.filter(o=>o.b!=='C');description='Луч OA и луч OB образуют угол. Добавляй точки, отрезки и прямые своими руками. Запиши, каким точкам условия соответствуют выбранные имена.';}
 }
 else if([57,69,70,86].includes(n)){scene={points:[point('A',110,300),point('B',540,280),point('C',290,100)],objects:[line('A','B','line')]};description='Вспомогательная модель приёма: построй через C перпендикуляр к AB. Сравни его с другими прямыми через C. В письменном решении используй буквы исходного условия.';}
 else{scene=G.scene('segment');}
 return {scene,figure,description,controls,measure};}
function mount(el,p,saved,onChange){if(p.model==='none'){el.innerHTML='<p>Возьми свой учебник и линейку. Здесь нужны твои измерения, поэтому заранее заданного численного ответа нет.</p><p>Запиши данные и единицы на шаге письменного ответа.</p>';return {destroy(){}};}
 const config=make(p);el.innerHTML='<p class="model-note"></p><div class="model-controls"></div><div class="model-measures" aria-live="polite"></div><div class="construction"></div>';
 el.querySelector('.model-note').textContent=config.description;const extra=el.querySelector('.model-controls'),read=el.querySelector('.model-measures');let lab;
 function update(){if(config.measure)read.textContent=config.measure(lab.board);}
 lab=root.GeoLab.mount(el.querySelector('.construction'),{scene:config.scene,figure:config.figure,goal:'explore'},ev=>{update();onChange(ev);});
 if(saved){lab.board.points=saved.points;lab.board.objects=saved.objects;lab.board.update();lab.redraw();}
 for(const control of config.controls){const label=document.createElement('label');label.textContent=control.label+' ';let input;if(control.choices){input=document.createElement('select');control.choices.forEach((s,i)=>{const o=document.createElement('option');o.value=i;o.textContent=s;input.append(o);});}else{input=document.createElement('input');input.type='range';input.min=control.min;input.max=control.max;input.step=1;}input.value=control.value;label.append(input);extra.append(label);input.addEventListener('input',()=>{lab.board.remember();control.update(lab.board,Number(input.value));lab.board.update();lab.redraw();update();onChange({type:'move',board:lab.board});});}
 extra.hidden=!config.controls.length;update();return lab;}
 root.ClassicModels={make,mount};
})(window);
