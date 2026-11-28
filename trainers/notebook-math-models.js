/* Interactive mathematical models. Only finite, bounded semantic state is shared. */
(function(root){
'use strict';
const clamp=(v,min,max,fallback=0)=>typeof v==='number'&&Number.isFinite(v)?Math.max(min,Math.min(max,v)):fallback;
const int=(v,min,max,fallback=0)=>Math.round(clamp(v,min,max,fallback));
const vec=(a,b)=>a.map((v,i)=>v-b[i]);
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=a=>Math.hypot(...a);
const scale=(a,k)=>a.map(v=>v*k);
const vertices=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
const names=['A','B','C','D','A₁','B₁','C₁','D₁'];
const edges=[];for(let i=0;i<8;i++)for(let j=i+1;j<8;j++)if(vertices[i].filter((v,k)=>v!==vertices[j][k]).length===1)edges.push([i,j]);
const planes=[{n:[1,1,1],d:1.7,name:'Треугольник: x+y+z=1,7'},{n:[0,0,1],d:.25,name:'Четырёхугольник: z=0,25'},{n:[1,1,1],d:0,name:'Шестиугольник: x+y+z=0'},{n:[1,1,.5],d:.75,name:'Наклонная плоскость'}];
function sectionPoints(n,d){
 const p=[];const add=a=>{if(!p.some(b=>norm(vec(a,b))<1e-7))p.push(a);};
 for(const [i,j] of edges){const a=vertices[i],b=vertices[j],fa=dot(n,a)-d,fb=dot(n,b)-d;if(Math.abs(fa)<1e-8)add(a.slice());if(Math.abs(fb)<1e-8)add(b.slice());if(fa*fb<0){const t=fa/(fa-fb);add(a.map((v,k)=>v+t*(b[k]-v)));}}
 if(p.length<3)return p;
 const c=[0,1,2].map(k=>p.reduce((s,a)=>s+a[k],0)/p.length);
 const ref=Math.abs(n[0])<.8*norm(n)?[1,0,0]:[0,1,0];
 const u=scale(cross(n,ref),1/norm(cross(n,ref))),v=cross(scale(n,1/norm(n)),u);
 return p.sort((a,b)=>Math.atan2(dot(vec(a,c),v),dot(vec(a,c),u))-Math.atan2(dot(vec(b,c),v),dot(vec(b,c),u)));
}
function normalize(type,x){
 x=x&&typeof x==='object'?x:{};
 switch(type){
  case 'line':case 'rline':return {signs:Array.from({length:type==='line'?3:4},(_,i)=>['?','+','−'].includes(x.signs?.[i])?x.signs[i]:'?'),checked:x.checked===true};
  case 'setline':return {op:int(x.op,0,3,0)};
  case 'venn':return {op:int(x.op,0,3,0),mask:int(x.mask,0,7,0),checked:x.checked===true};
  case 'dice':return {sum:int(x.sum,2,12,7),cells:Array.isArray(x.cells)?[...new Set(x.cells.filter(v=>Number.isInteger(v)&&v>=0&&v<36))].sort((a,b)=>a-b):[],checked:x.checked===true};
  case 'circle':return {angle:int(x.angle,-720,720,60)};
  case 'parabola':case 'hyperbola':return {a:[-3,-2,-1,1,2,3].includes(x.a)?x.a:1,m:int(x.m,-5,5,2),n:int(x.n,-5,5,type==='parabola'?-3:3)};
  case 'graph':return {kind:int(x.kind,0,5,0)};
  case 'det':return {a:int(x.a,-12,12,2),b:int(x.b,-12,12,-3),c:int(x.c,-12,12,4),d:int(x.d,-12,12,5)};
  case 'det3':return {step:int(x.step,0,6,0)};
  case 'gauss':return {step:int(x.step,0,3,0)};
  case 'cube':case 'section':return {angle:int(x.angle,-180,180,-35),plane:int(x.plane,0,3,0),stage:int(x.stage,0,2,2)};
  case 'triangle':return {b:int(x.b,10,80,21),kind:int(x.kind,0,2,0)};
  case 'similar':return {ratio:int(x.ratio,1,9,4)};
  case 'projection':return {h:int(x.h,1,15,12),p:int(x.p,1,15,9),show:x.show!==false};
  default:return {};
 }
}
const NS='http://www.w3.org/2000/svg';
const E=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const svg=(content,view='0 0 460 300')=>{const e=document.createElementNS(NS,'svg');e.setAttribute('viewBox',view);e.setAttribute('role','img');e.setAttribute('aria-label','Математическая модель');e.innerHTML=content;return e;};
const line=(x1,y1,x2,y2,stroke='#2a526d',width=2,dash='')=>'<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+stroke+'" stroke-width="'+width+'" '+(dash?'stroke-dasharray="'+dash+'"':'')+' stroke-linecap="round"/>';
const label=(x,y,t,color='#172c44',size=14)=>'<text x="'+x+'" y="'+y+'" fill="'+color+'" font-size="'+size+'" font-family="system-ui,sans-serif" text-anchor="middle">'+t+'</text>';
const circle=(x,y,r,fill='#125b8f',stroke='#125b8f')=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="2"/>';
const poly=(p,fill,stroke='#125b8f',dash='')=>'<polygon points="'+p.map(a=>a.join(',')).join(' ')+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="2" '+(dash?'stroke-dasharray="'+dash+'"':'')+'/>';
const path=(d,stroke='#125b8f',width=3,fill='none')=>'<path d="'+d+'" stroke="'+stroke+'" stroke-width="'+width+'" fill="'+fill+'" stroke-linecap="round" stroke-linejoin="round"/>';
const fmt=v=>Math.abs(v)<1e-10?'0':Number(v.toFixed(3)).toString().replace('.',',');
function mount(host,type,initial,onChange,lessonId){
 let m=normalize(type,initial);host.replaceChildren();
 const controls=E('div',undefined,'controls'),view=E('div',undefined,'model-view'),status=E('p',undefined,'sub');host.append(controls,view,status);
 function change(p,rebuild=false){
  const selector='button,select,input';
  const focusIndex=Array.from(host.querySelectorAll(selector)).indexOf(document.activeElement);
  m=normalize(type,{...m,...p});
  onChange({...m});
  if(rebuild)build();
  paint();
  if(focusIndex>=0&&!host.contains(document.activeElement))host.querySelectorAll(selector)[focusIndex]?.focus({preventScroll:true});
 }
 function button(text,fn,pressed){const b=E('button',text);b.type='button';if(pressed!==undefined)b.setAttribute('aria-pressed',String(pressed));b.addEventListener('click',fn);controls.append(b);return b;}
 function range(title,key,min,max,step=1){const w=E('label',title+' '),input=E('input'),out=E('output',String(m[key]));input.type='range';input.min=min;input.max=max;input.step=step;input.value=m[key];input.setAttribute('aria-label',title);input.addEventListener('input',()=>{out.textContent=input.value;change({[key]:Number(input.value)});});w.append(input,out);controls.append(w);}
 function select(title,key,values){const w=E('label',title+' '),s=E('select');for(const [value,t] of values){const o=E('option',t);o.value=value;s.append(o);}s.value=m[key];s.onchange=()=>change({[key]:Number(s.value),...(type==='dice'?{cells:[],checked:false}:type==='venn'?{mask:0,checked:false}:{})},type==='dice'||type==='venn');w.append(s);controls.append(w);}
 function build(){
 controls.replaceChildren();
 if(type==='line'||type==='rline'){m.signs.forEach((sign,i)=>button('Интервал '+(i+1)+': '+sign,()=>{const a=m.signs.slice();a[i]={'?':'+','+':'−','−':'?'}[a[i]];change({signs:a,checked:false},true);}));button('Проверить знаки',()=>change({checked:true}));}
 if(type==='setline')select('Операция','op',[[0,'Пересечение A∩B'],[1,'Объединение A∪B'],[2,'A∖B'],[3,'B∖A']]);
 if(type==='venn'){select('Операция','op',[[0,'A∩B'],[1,'A∪B'],[2,'A∖B'],[3,'B∖A']]);['Только A','Общая часть','Только B'].forEach((t,i)=>button(t,()=>change({mask:m.mask^(1<<i),checked:false},true),!!(m.mask&(1<<i))));button('Проверить закраску',()=>change({checked:true}));}
 if(type==='dice'){select('Сумма очков','sum',Array.from({length:11},(_,i)=>[i+2,String(i+2)]));button('Проверить исходы',()=>change({checked:true}));button('Очистить',()=>change({cells:[],checked:false}));}
 if(type==='circle')range('Угол, °','angle',-720,720,15);
 if(type==='parabola'||type==='hyperbola'){select('a','a',[-3,-2,-1,1,2,3].map(a=>[a,String(a)]));range('m','m',-5,5);range('n','n',-5,5);}
 if(type==='graph')select('Функция','kind',[[0,'y = 2x − 7'],[1,'y = x²'],[2,'y = x³'],[3,'y = 6/x'],[4,'y = √x'],[5,'y = |x|']]);
 if(type==='det'){for(const k of ['a','b','c','d']){const w=E('label',k+' = '),input=E('input');input.type='number';input.min=-12;input.max=12;input.value=m[k];input.setAttribute('aria-label','Элемент '+k);input.addEventListener('change',()=>{change({[k]:Number(input.value)});input.value=m[k];});w.append(input);controls.append(w);}}
 if(type==='det3'||type==='gauss'){button('Сначала',()=>change({step:0}));button('Назад',()=>change({step:m.step-1}));button('Следующий шаг',()=>change({step:m.step+1}));}
 if(type==='cube'||type==='section'){range('Поворот куба','angle',-180,180,5);if(type==='section'){select('Плоскость','plane',planes.map((p,i)=>[i,p.name]));select('Построение','stage',[[0,'Три исходные точки'],[1,'Все точки пересечения'],[2,'Готовое сечение']]);}}
 if(type==='triangle'){range('Угол B, °','b',10,80);select('Построение','kind',[[0,'Медиана и биссектриса'],[1,'Высота и биссектриса'],[2,'Высота и медиана']]);}
 if(type==='similar')range('BK/BA (десятые)','ratio',1,9);
 if(type==='projection'){range('AO — перпендикуляр','h',1,15);range('OB — проекция','p',1,15);button('Третья прямая',()=>change({show:!m.show},true),m.show);}
 }
 function paint(){
 view.replaceChildren();status.textContent='';
 const show=(s,v)=>view.append(svg(s,v));
 if(type==='line'||type==='rline'){
  const rational=type==='rline',xs=rational?[135,230,325]:[150,310],values=rational?['−5','−3','2']:['−7','3'],bounds=[25,...xs,435];
  let s=line(20,125,442,125)+path('M435 119 L443 125 L435 131','#2a526d',2)+label(445,145,'x');
  xs.forEach((x,i)=>{s+=circle(x,125,5,rational&&i!==1?'#125b8f':'#fff')+label(x,150,values[i]);});
  m.signs.forEach((v,i)=>{const x=(bounds[i]+bounds[i+1])/2;s+=label(x,98,v,v==='+'?'#176b4a':'#98461c',25);if(m.checked&&v===(rational?['−','+','−','+']:['+','−','+'])[i])s+=label(x,180,'✓','#176b4a',20);});
  show(s,'0 0 460 205');status.textContent=m.checked?(m.signs.join('')===(rational?'−+−+':'+−+')?'Все знаки верны. Выбери нужные интервалы с учётом граничных точек.':'Проверь знак подстановкой числа из каждого интервала.'):'Нажимай кнопки над моделью: ? → + → −. '+(rational?'Точка −3 исключена из ОДЗ.':'Нули −7 и 3 не входят в строгое неравенство.');return;
 }
 if(type==='setline'){
  const x=v=>40+(v+6)*38,open=(v,y,c)=>circle(x(v),y,5,'white',c),closed=(v,y,c)=>circle(x(v),y,5,c,c);
  let s=label(24,55,'A')+label(24,100,'B')+label(25,155,'?');
  s+=line(x(-3),50,x(5),50,'#125b8f',5)+closed(-3,50,'#125b8f')+closed(5,50,'#125b8f');
  s+=line(42,95,x(4),95,'#8a4c8d',5)+path('M48 89 L39 95 L48 101','#8a4c8d',2)+open(4,95,'#8a4c8d');
  const c='#17755c';const r=[[-3,4,true,false],[-6,5,false,true],[4,5,true,true],[-6,-3,false,false]][m.op];
  s+=line(x(r[0]),150,x(r[1]),150,c,5);if(r[0]===-6)s+=path('M48 144 L39 150 L48 156',c,2);else s+=(r[2]?closed:open)(r[0],150,c);s+=(r[3]?closed:open)(r[1],150,c);
  for(let n=-5;n<=5;n++)s+=line(x(n),178,x(n),185,'#8293a2',1)+label(x(n),202,String(n),'#52687b',12);
  show(s,'0 0 480 225');status.textContent=['A∩B = [−3;4)','A∪B = (−∞;5]','A∖B = [4;5]','B∖A = (−∞;−3)'][m.op];return;
 }
 if(type==='venn'){
  const c='#80c4b5';let s='<defs><clipPath id="nv-a"><circle cx="175" cy="115" r="82"/></clipPath><clipPath id="nv-b"><circle cx="285" cy="115" r="82"/></clipPath><mask id="nv-not-a"><rect width="460" height="240" fill="white"/><circle cx="175" cy="115" r="82" fill="black"/></mask><mask id="nv-not-b"><rect width="460" height="240" fill="white"/><circle cx="285" cy="115" r="82" fill="black"/></mask></defs>';
  if(m.mask&1)s+='<circle cx="175" cy="115" r="82" fill="'+c+'" mask="url(#nv-not-b)"/>';
  if(m.mask&2)s+='<circle cx="285" cy="115" r="82" fill="'+c+'" clip-path="url(#nv-a)"/>';
  if(m.mask&4)s+='<circle cx="285" cy="115" r="82" fill="'+c+'" mask="url(#nv-not-a)"/>';
  s+=circle(175,115,82,'none','#125b8f')+circle(285,115,82,'none','#8a4c8d')+label(135,40,'A')+label(325,40,'B')+label(130,120,'A∖B')+label(230,120,'A∩B')+label(330,120,'B∖A');
  show(s,'0 0 460 225');status.textContent=m.checked?(m.mask===[2,7,1,4][m.op]?'Верная область.':'Проверь, какие элементы должны принадлежать выбранной операции.'):'Закрась части кругов с помощью трёх кнопок. Точки в общей части принадлежат обоим множествам.';return;
 }
 if(type==='dice'){
  const grid=E('div',undefined,'dice');for(let i=0;i<36;i++){const a=Math.floor(i/6)+1,b=i%6+1;const t=E('button',a+'+'+b);t.type='button';t.setAttribute('aria-label','Первый кубик '+a+', второй '+b);t.setAttribute('aria-pressed',String(m.cells.includes(i)));t.onclick=()=>{const cells=m.cells.includes(i)?m.cells.filter(x=>x!==i):[...m.cells,i];change({cells,checked:false});};grid.append(t);}view.append(grid);
  const target=Array.from({length:36},(_,i)=>i).filter(i=>Math.floor(i/6)+1+i%6+1===m.sum);const ok=target.length===m.cells.length&&target.every(i=>m.cells.includes(i));
  status.textContent=m.checked?(ok?'Верно: P = '+target.length+'/36.':'Есть лишние или пропущенные исходы. Проверь каждую пару.'):'Выбери пары, сумма которых равна '+m.sum+'. Выбрано '+m.cells.length+' из 36 исходов.';return;
 }
 if(type==='circle'){
  const x=230,y=145,r=108,t=m.angle*Math.PI/180,c=Math.cos(t),sn=Math.sin(t),px=x+r*c,py=y-r*sn;let s=circle(x,y,r,'none','#7b91a3')+line(65,y,395,y)+line(x,15,x,277)+label(397,y-6,'cos α')+label(x+25,18,'sin α');
  for(let d=0;d<360;d+=30){const a=d*Math.PI/180;s+=circle(x+r*Math.cos(a),y-r*Math.sin(a),2,'#8293a2','#8293a2');}
  s+=line(x,y,px,py,'#125b8f',3)+line(px,py,px,y,'#b25c36',2,'5 5')+line(px,py,x,py,'#17755c',2,'5 5')+circle(px,py,6)+label(x+r+13,y+16,'1')+label(x-r-14,y+16,'−1')+label(x-16,y-r,'1')+label(x-18,y+r,'−1')+label(285,90,'I')+label(175,90,'II')+label(175,211,'III')+label(285,211,'IV');
  show(s);status.textContent='α = '+m.angle+'°; sin α ≈ '+fmt(sn)+'; cos α ≈ '+fmt(c)+'; tg α '+(Math.abs(c)<1e-9?'не определён':'≈ '+fmt(sn/c))+'.';return;
 }
 if(['graph','parabola','hyperbola'].includes(type)){
  const cx=230,cy=145,k=17,X=x=>cx+k*x,Y=y=>cy-k*y;
  let s='<defs><clipPath id="nv-plot"><rect x="8" y="8" width="444" height="278"/></clipPath></defs>';
  for(let i=-12;i<=12;i++){if(i!==0)s+=line(X(i),8,X(i),286,'#e5edf3',1);}
  for(let i=-8;i<=8;i++){if(i!==0)s+=line(8,Y(i),452,Y(i),'#e5edf3',1);}
  s+=line(8,cy,451,cy)+line(cx,286,cx,8)+label(447,cy-7,'x')+label(cx+13,18,'y')+label(cx+10,cy+15,'0');
  for(let i=-10;i<=10;i+=2)if(i)s+=label(X(i),cy+15,String(i),'#52687b',10);
  for(let i=-6;i<=6;i+=2)if(i)s+=label(cx-11,Y(i)+4,String(i),'#52687b',10);
  const funcs=[x=>2*x-7,x=>x*x,x=>x*x*x,x=>6/x,x=>Math.sqrt(x),x=>Math.abs(x)];
  const f=type==='parabola'?x=>m.a*(x-m.m)**2+m.n:type==='hyperbola'?x=>m.a/(x-m.m)+m.n:funcs[m.kind];
  let d='',last=null;for(let i=0;i<=520;i++){const x=-13+i*.05,y=f(x);if(!Number.isFinite(y)||Math.abs(y)>20){last=null;continue;}const pen=last!==null&&Math.abs(y-last)<8?' L':' M';d+=pen+X(x).toFixed(2)+' '+Y(y).toFixed(2);last=y;}
  s+='<g clip-path="url(#nv-plot)">';
  if(type==='hyperbola')s+=line(X(m.m),8,X(m.m),286,'#b25c36',1.6,'5 4')+line(8,Y(m.n),452,Y(m.n),'#b25c36',1.6,'5 4');
  s+=path(d)+((type==='parabola'||type==='hyperbola')?circle(X(m.m),Y(m.n),5,'#b25c36','#b25c36'):'')+'</g>';show(s);
  status.textContent=type==='parabola'?'Вершина ('+m.m+'; '+m.n+'). Ветви '+(m.a>0?'вверх':'вниз')+'.':type==='hyperbola'?'Центр ('+m.m+'; '+m.n+'). Асимптоты x = '+m.m+', y = '+m.n+'.':'Измени вид функции. Найди нули, область определения и характер изменения по графику.';return;
 }
 function matrix(rows,highlight){const t=E('table',undefined,'matrix');const body=E('tbody');rows.forEach((r,i)=>{const tr=E('tr');r.forEach((v,j)=>{const td=E('td',String(v));if(highlight?.(i,j))td.style.background='#d5ebdf';tr.append(td);});body.append(tr);});t.append(body);view.append(t);}
 if(type==='det'){matrix([[m.a,m.b],[m.c,m.d]]);status.textContent='Δ = ('+m.a+')·('+m.d+') − ('+m.b+')·('+m.c+') = '+(m.a*m.d-m.b*m.c)+'.';return;}
 if(type==='det3'){
  const a=[[1,2,3],[0,1,2],[1,0,4]];const perm=[[0,1,2],[1,2,0],[2,0,1],[2,1,0],[0,2,1],[1,0,2]];matrix(a,(i,j)=>m.step>0&&j===perm[m.step-1][i]);
  const terms=[4,4,0,3,0,0];const sums=terms.slice(0,m.step).map((v,i)=>(i<3?'+':'−')+v).join(' ');
  status.textContent=m.step===0?'Выделяй по одной диагонали. Первые три произведения складываются, последние три вычитаются.':'Шаг '+m.step+' из 6: '+sums+(m.step===6?' = 5.':'');return;
 }
 if(type==='gauss'){
  const rows=[[[1,-1,2,1],[2,1,-1,3],[-1,2,5,8]],[[1,-1,2,1],[0,3,-5,1],[0,1,7,9]],[[1,-1,2,1],[0,1,7,9],[0,0,-26,-26]],[[1,0,0,1],[0,1,0,2],[0,0,1,1]]];matrix(rows[m.step],(i,j)=>j===3);
  status.textContent=['Расширенная матрица исходной системы. Последний столбец — свободные члены.','R₂←R₂−2R₁; R₃←R₃+R₁.','Поменяй R₂ и R₃; R₃←R₃−3R₂.','Обратный ход: z=1, y=2, x=1. Проверь все исходные строки.'][m.step];return;
 }
 if(type==='cube'||type==='section'){
  const yaw=m.angle*Math.PI/180,el=.48,pr=p=>{const a=p[0]*Math.cos(yaw)-p[1]*Math.sin(yaw),b=p[0]*Math.sin(yaw)+p[1]*Math.cos(yaw);return [230+92*a,146-92*(p[2]*Math.cos(el)-b*Math.sin(el)),b*Math.cos(el)+p[2]*Math.sin(el)];};
  const towardViewer=[Math.sin(yaw)*Math.cos(el),Math.cos(yaw)*Math.cos(el),Math.sin(el)];
  const visibleSide=(a,b)=>a.some((v,k)=>Math.abs(Math.abs(v)-1)<1e-7&&Math.abs(v-b[k])<1e-7&&v*towardViewer[k]>1e-8);
  const pp=vertices.map(pr);let s='';
  for(const [i,j] of edges){const a=pp[i],b=pp[j];s+=line(a[0],a[1],b[0],b[1],'#5a7285',2,visibleSide(vertices[i],vertices[j])?'':'5 4');}
  function rightAngle(first,corner,last){
   const origin=vertices[corner],u=vec(vertices[first],origin),v=vec(vertices[last],origin);
   const points=[u,u.map((n,i)=>n+v[i]),v].map(w=>origin.map((n,i)=>n+.10*w[i]));
   points.slice(1).forEach((q,i)=>{const a=pr(points[i]),b=pr(q);s+=line(a[0],a[1],b[0],b[1],'#294c65',1.5,visibleSide(points[i],q)?'':'3 2');});
  }
  if(lessonId==='parallel-perp'){rightAngle(4,0,1);rightAngle(4,0,3);}
  if(lessonId==='positions')rightAngle(0,1,5);
  if(type==='section'){const p=planes[m.plane],points=sectionPoints(p.n,p.d),q=points.map(pr);
   if(m.stage===2&&q.length>=3){
    s+=poly(q.map(a=>a.slice(0,2)),'#53adbd65','none');
    q.forEach((a,i)=>{const j=(i+1)%q.length,b=q[j];s+=line(a[0],a[1],b[0],b[1],'#167b8a',2,visibleSide(points[i],points[j])?'':'5 4');});
   }const count=m.stage===0?Math.min(3,q.length):q.length;for(let i=0;i<count;i++)s+=circle(q[i][0],q[i][1],5,'#ad3970','#ad3970')+label(q[i][0]+9,q[i][1]-7,String(i+1),'#8b2e5e');status.textContent=m.stage===2?'Сечение: '+q.length+(q.length<5?' стороны.':' сторон.')+' Каждая сторона принадлежит одной грани куба.':'Точки секущей плоскости на рёбрах. Поверни куб, затем найди остальные вершины.';}else status.textContent='Вращай куб; сравни рёбра и грани, которые лежат в одной плоскости, параллельны или пересекаются.';
  pp.forEach((a,i)=>{s+=circle(a[0],a[1],3,'#5a7285','#5a7285')+label(a[0]+(a[0]<230?-12:12),a[1]+(a[1]<146?-7:15),names[i]);});show(s,'0 -22 460 344');return;
 }
 if(type==='triangle'){
  const A=[45,245],B=[415,245],b=m.b*Math.PI/180,L=B[0]-A[0],C=[B[0]-L*Math.cos(b)**2,B[1]-L*Math.cos(b)*Math.sin(b)],M=[230,245],H=[C[0],245];const ca=norm(vec(C,A)),cb=norm(vec(C,B)),D=[(A[0]*cb+B[0]*ca)/(ca+cb),245];
  let s=poly([A,B,C],'#edf4f8','#294c65');const u=scale(vec(A,C),1/ca),v=scale(vec(B,C),1/cb),a=C.map((x,i)=>x+13*u[i]),bb=C.map((x,i)=>x+13*(u[i]+v[i])),c=C.map((x,i)=>x+13*v[i]);s+=path('M'+a.join(' ')+' L'+bb.join(' ')+' L'+c.join(' '),'#294c65',1.5);
  const seg=(q,col,n)=>line(C[0],C[1],q[0],q[1],col,2.5)+circle(q[0],q[1],4,col,col)+label(q[0],267,n,col);
  if(m.b===45)s+=seg(M,'#125b8f',['M=D','H=D','H=M'][m.kind]);else {if(m.kind!==1)s+=seg(M,'#125b8f','M');if(m.kind!==2)s+=seg(D,'#9b3c76','D');if(m.kind!==0)s+=seg(H,'#17755c','H');}if(m.kind!==0)s+=path('M'+(H[0]+10)+' '+H[1]+' v-10 h-10','#17755c',1.5);
  s+=label(A[0]-7,261,'A')+label(B[0]+9,261,'B')+label(C[0],C[1]-10,'C')+label(B[0]-25,237,m.b+'°');show(s,'0 0 460 285');
  status.textContent='∠B='+m.b+'°. '+(m.kind===0?'Угол между медианой и биссектрисой: '+Math.abs(45-m.b)+'°.':m.kind===1?'Угол между высотой и биссектрисой: '+Math.abs(45-m.b)+'°.':'Угол между высотой и медианой: '+Math.abs(90-2*m.b)+'°.');return;
 }
 if(type==='similar'){
  const A=[65,235],B=[220,35],C=[400,235],t=m.ratio/10,K=B.map((v,i)=>v+t*(A[i]-v)),M=B.map((v,i)=>v+t*(C[i]-v));let s=poly([A,B,C],'#edf4f8','#294c65')+poly([B,K,M],'#9ac8e88c','#125b8f')+label(A[0]-8,A[1]+18,'A')+label(B[0],B[1]-10,'B')+label(C[0]+8,C[1]+18,'C')+label(K[0]-10,K[1],'K')+label(M[0]+10,M[1],'M');show(s,'0 0 460 275');status.textContent='BK/BA = '+m.ratio+'/10 = KM/AC. При AC=20 получаем KM='+fmt(20*t)+'.';return;
 }
 if(type==='projection'){
  const O=[170,205],A=[170,205-m.h*10],B=[170+m.p*13,205],C=[B[0]+35,177],D=[B[0]-35,233];let s=poly([[40,244],[352,244],[440,155],[128,155]],'#dcecf380','#8aa2b3')+line(O[0],O[1],A[0],A[1],'#9b3c76',3)+line(A[0],A[1],B[0],B[1],'#125b8f',3)+line(O[0],O[1],B[0],B[1],'#17755c',3)+path('M180 205 v-10 h-10','#294c65',1.7);
  if(m.show){
   // Project the two right-angle squares onto the same rays as their segments.
   const side=Math.min(.8,m.p/3),length=Math.hypot(m.p,m.h);
   const alongOB=[-13*side,0],alongAB=[-13*m.p/length*side,-10*m.h/length*side];
   const alongBC=[8*side,-6.4*side];
   const mark=(u,v)=>path('M'+[B[0]+u[0],B[1]+u[1]].join(' ')+' l'+v.join(' ')+' l'+[-u[0],-u[1]].join(' '),'#b25c36',1.5);
   s+=line(C[0],C[1],D[0],D[1],'#b25c36',2)+label(C[0]+5,C[1]-9,'C','#b25c36');
   s+=mark(alongOB,scale(alongBC,-1))+mark(alongAB,alongBC);
  }
  s+=label(A[0]-10,A[1]-5,'A')+label(O[0]-12,O[1]+16,'O')+label(B[0]+10,B[1]+16,'B')+label(75,232,'α')+label(152,(O[1]+A[1])/2,String(m.h),'#9b3c76')+label((O[0]+B[0])/2,224,String(m.p),'#17755c');show(s);
  status.textContent='AB² = '+m.h+'² + '+m.p+'² = '+(m.h*m.h+m.p*m.p)+'; AB ≈ '+fmt(Math.hypot(m.h,m.p))+'. '+(m.show?'BC ⟂ OB ⇒ BC ⟂ AB.':'');return;
 }
 }
 build();paint();
}
root.NotebookModels=Object.freeze({normalize,mount,sectionPoints,planes});
})(globalThis);
