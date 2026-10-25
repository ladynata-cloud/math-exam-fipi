/* Optional geometric discoveries. Original task generators, graders and progress stay native. */
(function(global){
'use strict';
const doc=global.document;
if(!doc)return;
const page=Number(doc.body.dataset.ogeGeometry);
if(![15,16,17,18].includes(page)||new URLSearchParams(doc.location.search).has('selftest'))return;
const q=(s,r=doc)=>r.querySelector(s),all=(s,r=doc)=>Array.from(r.querySelectorAll(s));
const el=(tag,text,cls)=>{const n=doc.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
const fmt=n=>Number(n.toFixed(2)).toLocaleString('ru-RU');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const memories=new Map();
function details(label){const d=el('details',null,'ocg-details');d.append(el('summary',label));return d;}
function button(text,action){const b=el('button',text,'ocg-button');b.type='button';b.addEventListener('click',action);return b;}
function range(host,key,label,min,max,value,step=1){const wrap=el('label',null,'ocg-control'),caption=el('span',label),out=el('output',fmt(value)),input=el('input');input.type='range';Object.assign(input,{min,max,value,step});input.dataset.geometryControl=key;input.setAttribute('aria-label',label);wrap.append(caption,out,input);host.append(wrap);input.addEventListener('input',()=>out.textContent=fmt(+input.value));return input;}
function point(x,y,label,dx=10,dy=-8){return `<circle cx="${x}" cy="${y}" r="4" fill="#233c30"/><text x="${x+dx}" y="${y+dy}">${esc(label)}</text>`;}
function line(x1,y1,x2,y2,cls=''){return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}"/>`;}
function label(x,y,text,anchor='middle'){return `<text x="${x}" y="${y}" text-anchor="${anchor}">${esc(text)}</text>`;}
function poly(points,cls='ocg-shape'){return `<polygon points="${points.map(p=>p.join(',')).join(' ')}" class="${cls}"/>`;}
function rad(deg){return deg*Math.PI/180;}
function circ(cx,cy,r,a){return[cx+r*Math.cos(rad(a)),cy-r*Math.sin(rad(a))];}
function figureNavigation(wrap,title){
 wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label',title+'; рисунок можно прокручивать');
 const nav=el('div',null,'ocg-figure-nav');nav.append(el('p','Если рисунок не помещается, прокрути его пальцем или кнопками. Стрелки клавиатуры тоже работают.','ocg-scroll-note'));
 const left=button('← Влево',()=>{wrap.scrollLeft-=Math.max(160,wrap.clientWidth*.8);}),right=button('Вправо →',()=>{wrap.scrollLeft+=Math.max(160,wrap.clientWidth*.8);});
 left.dataset.geometryPan='left';right.dataset.geometryPan='right';nav.append(left,right);wrap.before(nav);
 return nav;
}
function frame(host,title){const wrap=el('div',null,'ocg-figure-scroll');const figure=el('div',null,'ocg-figure');wrap.append(figure);host.append(wrap);figureNavigation(wrap,title);return svg=>{figure.innerHTML=`<svg viewBox="0 0 440 290" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title>${svg}</svg>`;};}
function controls(host){const box=el('div',null,'ocg-controls');host.append(box);return box;}
function watch(inputs,run){inputs.forEach(i=>i.addEventListener('input',run));run();}
const captions={adjacent:'Меняй внутренний угол. Что происходит с соседним внешним углом?',tangentChord:'Меняй дугу AB. Сравни её с углом между касательной в A и хордой AB.',cyclic:'Двигай вершину D по окружности. Сравни противоположные углы A и C.',sine:'Меняй радиус и угол. Сравни длину хорды BC с синусом вписанного угла A.',isosceles:'Меняй угол при основании. Сравни два угла при основании и угол при вершине.',trapezoidAngles:'Меняй нижний угол равнобедренной трапеции. Сравни углы при каждом основании.',circleAngle:'Двигай точку C по большой дуге AB. Затем меняй центральный угол: сравни два угла над одной и той же малой дугой AB.',tangent:'Отодвигай точку P от окружности. Посмотри, какой угол между радиусом OT и касательной PT сохраняется.',chord:'Отодвигай хорду от центра. Сравни расстояние OM и длину хорды AB.',incircle:'Меняй радиус. Сравни его с расстоянием между двумя параллельными касательными.',squareIncircle:'Меняй радиус вписанной окружности. Сравни диаметр со стороной квадрата, затем найди площадь.',trapezoidMidSegments:'Меняй основания трапеции. Проведи диагональ и сравни два отрезка средней линии с основаниями.',regular:'Выбери число сторон. Сравни радиус описанной окружности с расстоянием от центра до стороны.',power:'Передвигай точку P внутри окружности. Сравни произведения отрезков двух хорд.',area:'Меняй наклон, сохраняя основание и высоту. Изменится ли площадь?',square:'Меняй сторону квадрата. Сравни сторону, периметр и площадь: как пройти от периметра к площади?',rhombArea:'Меняй диагонали ромба. Дострой прямоугольник и сравни площади: какую его часть занимает ромб?',rhombHeight:'Меняй сторону и угол ромба. Сравни сторону с высотой; затем найди площадь по основанию и высоте.',diagonal:'Меняй фигуру. Следи за длинами диагоналей и точкой их пересечения.',angles:'Меняй угол. Сравни соседние и противоположные углы.',gridLength:'Меняй горизонтальный и вертикальный шаги. Как найти прямое расстояние между концами?',gridArea:'Сначала выбери основание и высоту. Нажми «Достроить прямоугольник» и сравни площади.',midline:'Меняй размеры. Нажми «Показать среднюю линию»: какие стороны она соединяет?',ratio:'Меняй коэффициент подобия. Сравни, во сколько раз меняются длины и площади.'};
function model(host,kind,shape){
 host.dataset.geometryModel=kind;host.append(el('p',captions[kind],'ocg-instruction'),el('p','Это отдельная учебная модель. Её числа не являются ответом к твоей задаче.','ocg-note'));
 const ctl=controls(host),draw=frame(host,captions[kind]),out=el('output',null,'ocg-reading');out.setAttribute('aria-live','polite');host.append(out);
 if(kind==='adjacent'){
  const angle=range(ctl,'angle','Внутренний угол, °',25,160,110);
  watch([angle],()=>{const a=+angle.value,C=[220,220],B=circ(220,220,160,180-a);draw(poly([[40,220],B,C])+line(220,220,410,220,'ocg-dashed')+point(40,220,'A',-12,24)+point(...B,'B')+point(...C,'C',0,24)+label(160,196,`${a}°`)+label(292,203,`${180-a}°`));out.textContent=`Внутренний ${a}° и внешний ${180-a}° вместе дают 180°. Они смежные: одна сторона общая, две другие — противоположные лучи.`;});
 }else if(kind==='circleAngle'){
  const angle=range(ctl,'central','Центральный угол AOB, °',40,180,80,2),position=range(ctl,'vertex','Положение точки C на большой дуге, °',220,340,255,5);
  watch([angle,position],()=>{const a=+angle.value,A=circ(220,145,105,20),B=circ(220,145,105,20+a),C=circ(220,145,105,+position.value);draw(`<circle cx="220" cy="145" r="105" class="ocg-circle"/>`+line(...A,...B,'ocg-dashed')+line(220,145,...A)+line(220,145,...B)+line(...C,...A,'ocg-blue')+line(...C,...B,'ocg-blue')+point(...A,'A')+point(...B,'B')+point(...C,'C',8,22)+point(220,145,'O',-24,6));out.textContent=`Центральный угол: ${a}°. Вписанный угол ACB: ${a/2}°. При движении C по этой дуге вписанный угол не меняется.`;});
 }else if(kind==='tangentChord'){
  const angle=range(ctl,'arc','Дуга AB, °',40,160,100,5);
  watch([angle],()=>{const a=+angle.value,A=[325,145],B=circ(220,145,105,a);draw(`<circle cx="220" cy="145" r="105" class="ocg-circle"/>`+line(325,25,325,260,'ocg-dashed')+line(...A,...B,'ocg-blue')+line(220,145,...A)+point(...A,'A',10,20)+point(...B,'B',-20,-8)+point(220,145,'O',-20,20)+label(365,30,'касательная'));out.textContent=`Угол между хордой AB и верхним лучом касательной равен ${a/2}° — половине дуги AB (${a}°). Радиус OA перпендикулярен касательной.`;});
 }else if(kind==='cyclic'){
  const angle=range(ctl,'vertex','Положение вершины D, °',220,320,270,5);
  watch([angle],()=>{const D=+angle.value,pts=[0,60,180,D].map(a=>circ(220,145,105,a));draw(`<circle cx="220" cy="145" r="105" class="ocg-circle"/>`+poly(pts)+pts.map((p,i)=>point(...p,'ABCD'[i],8,i===3?22:-8)).join(''));out.textContent=`Угол A = ${(D-60)/2}°; угол C = ${(420-D)/2}°. Сумма противоположных углов равна 180°: они опираются на две дуги, которые вместе составляют окружность.`;});
 }else if(kind==='sine'){
  const angle=range(ctl,'angle','Вписанный угол A, °',20,75,40,5),radius=range(ctl,'radius','Радиус описанной окружности R',2,5,4);
  watch([angle,radius],()=>{const A=+angle.value,R=+radius.value,r=R*22,pts=[250,20,20+2*A].map(a=>circ(220,145,r,a)),side=2*R*Math.sin(rad(A));draw(`<circle cx="220" cy="145" r="${r}" class="ocg-circle"/>`+poly(pts)+pts.map((p,i)=>point(...p,'ABC'[i],8,i===0?22:-8)).join('')+point(220,145,'O')+label(220,275,`R=${R}; угол A=${A}°`));out.textContent=`BC ≈ ${fmt(side)}; sin A ≈ ${fmt(Math.sin(rad(A)))}. Отношение BC : sin A = 2R = ${2*R}. Угол A лежит напротив стороны BC.`;});
 }else if(kind==='isosceles'){
  const angle=range(ctl,'angle','Угол при основании, °',30,65,50,5);
  watch([angle],()=>{const A=+angle.value,h=90*Math.tan(rad(A)),bottom=260,top=bottom-h;draw(poly([[130,bottom],[310,bottom],[220,top]])+point(130,bottom,'A',-24,15)+point(310,bottom,'B',10,15)+point(220,top,'C',10,-8)+label(162,bottom-14,`${A}°`)+label(278,bottom-14,`${A}°`));out.textContent=`CA = CB, поэтому углы A и B равны ${A}°. Угол C = 180° − 2 · ${A}° = ${180-2*A}°.`;});
 }else if(kind==='trapezoidAngles'){
  const angle=range(ctl,'angle','Нижний угол равнобедренной трапеции, °',45,80,60,5);
  watch([angle],()=>{const A=+angle.value,shift=90/Math.tan(rad(A));draw(poly([[55,230],[385,230],[385-shift,140],[55+shift,140]])+label(79,218,`${A}°`)+label(346,218,`${A}°`)+label(55+shift,125,`${180-A}°`)+label(385-shift,125,`${180-A}°`));out.textContent=`Боковые стороны равны. Углы при нижнем основании: ${A}° и ${A}°. При верхнем: ${180-A}° и ${180-A}°. Углы при одной боковой стороне дают 180°.`;});
 }else if(kind==='tangent'){
  const distance=range(ctl,'distance','Расстояние OP при радиусе 5',6,12,9);
  watch([distance],()=>{const d=+distance.value,r=70,px=125+14*d,tx=125+r*5/d,ty=160-r*Math.sqrt(1-25/d/d);draw(`<circle cx="125" cy="160" r="70" class="ocg-circle"/>`+line(125,160,px,160,'ocg-dashed')+line(125,160,tx,ty)+line(tx,ty,px,160,'ocg-blue')+point(125,160,'O',-22,7)+point(tx,ty,'T',-8,-12)+line(125,160,tx,320-ty)+line(tx,320-ty,px,160,'ocg-blue')+point(tx,320-ty,'U',-8,24)+point(px,160,'P',6,25)+label(220,280,'OT ⟂ PT; OU ⟂ PU'));out.textContent=`OT = 5; OP = ${d}; PT = √(${d}² − 5²) ≈ ${fmt(Math.sqrt(d*d-25))}. PT = PU: отрезки касательных из P равны. Радиус в точку касания перпендикулярен касательной.`;});
 }else if(kind==='chord'){
  const distance=range(ctl,'distance','Расстояние от центра до хорды (радиус 5)',0,4.5,3,.5);
  watch([distance],()=>{const d=+distance.value,r=100,y=145-20*d,half=20*Math.sqrt(25-d*d);draw(`<circle cx="220" cy="145" r="100" class="ocg-circle"/>`+line(220-half,y,220+half,y,'ocg-blue')+line(220,145,220,y,'ocg-dashed')+line(220,145,220+half,y)+point(220,145,'O',-23,20)+point(220,y,'M',10,20)+point(220-half,y,'A',-20,-8)+point(220+half,y,'B')+label(220,270,'AM = MB'));out.textContent=`OM = ${fmt(d)}; половина хорды MB = √(5² − ${fmt(d)}²); AB ≈ ${fmt(2*Math.sqrt(25-d*d))}. Перпендикуляр из центра делит хорду пополам.`;});
 }else if(kind==='incircle'){
  const r=range(ctl,'radius','Радиус вписанной окружности',2,5,3,.5);
  watch([r],()=>{const R=+r.value*20;draw(poly([[95,145-R],[345,145-R],[320,145+R],[70,145+R]])+`<circle cx="220" cy="145" r="${R}" class="ocg-circle"/>`+line(220,145-R,220,145+R,'ocg-blue')+point(220,145,'O')+label(250,145-R/2,`r=${fmt(+r.value)}`)+label(250,145+R/2,`r=${fmt(+r.value)}`));out.textContent=`Между параллельными касательными: h = 2r = ${fmt(2*r.value)}. На рисунке окружность касается только оснований; касание боковых сторон здесь не задано.`;});
 }else if(kind==='squareIncircle'){
  const radius=range(ctl,'radius','Радиус вписанной окружности r',2,5,3,.5);
  watch([radius],()=>{const r=+radius.value,R=20*r,cx=220,cy=145;
   draw(poly([[cx-R,cy-R],[cx+R,cy-R],[cx+R,cy+R],[cx-R,cy+R]])+`<circle cx="${cx}" cy="${cy}" r="${R}" class="ocg-circle"/>`+line(cx-R,cy,cx+R,cy,'ocg-blue')+point(cx,cy,'O',-8,28)+label(cx-R/2,cy-15,'r')+label(cx+R/2,cy-15,'r')+label(cx,cy-R-14,`a = ${fmt(2*r)}`)+label(cx,277,`a = 2r = ${fmt(2*r)}`));
   out.textContent=`Окружность касается всех четырёх сторон квадрата. Его сторона равна диаметру: a = 2r = ${fmt(2*r)}. Площадь S = a² = ${fmt(2*r)}² = ${fmt(4*r*r)}. Радиус r — только половина стороны.`;
  });
 }else if(kind==='trapezoidMidSegments'){
  const top=range(ctl,'top','Меньшее основание BC',1,6,4),base=range(ctl,'base','Большее основание AD',7,12,10);let shown=false;
  const toggle=button('Провести диагональ AC',()=>{shown=!shown;toggle.setAttribute('aria-pressed',String(shown));toggle.textContent=shown?'Убрать диагональ AC':'Провести диагональ AC';run();});toggle.setAttribute('aria-pressed','false');ctl.append(toggle);
  const run=()=>{const a=+top.value,b=+base.value,k=24,A=[65,230],B=[105,60],C=[105+k*a,60],D=[65+k*b,230],M=[85,145],N=[85+k*(a+b)/2,145],P=[85+k*a/2,145];
   draw(poly([A,B,C,D])+line(...M,...N,'ocg-blue')+(shown?line(...A,...C,'ocg-dashed')+line(...P,...N)+point(...P,'P',10,-20)+label((M[0]+P[0])/2,195,fmt(a/2))+label((P[0]+N[0])/2,173,fmt(b/2)):'')+point(...A,'A',-20,12)+point(...B,'B',-20,-10)+point(...C,'C',10,-10)+point(...D,'D',10,12)+point(...M,'M',-25,20)+point(...N,'N',10,20)+label((B[0]+C[0])/2,31,`a = ${a}`)+label((A[0]+D[0])/2,273,`b = ${b}`));
   out.textContent=shown?`M и N — середины боковых сторон. Диагональ AC пересекает MN в своей середине P. В треугольнике ABC: MP = BC : 2 = ${fmt(a/2)}. В треугольнике ACD: PN = AD : 2 = ${fmt(b/2)}. Больший отрезок — половина большего основания, ${fmt(b/2)}; вся средняя линия равна ${fmt((a+b)/2)}.`:'M и N — середины боковых сторон. Проведи диагональ AC. Какие два треугольника получатся и где окажутся их средние линии?';
  };watch([top,base],run);
 }else if(kind==='regular'){
  const n=range(ctl,'sides','Число сторон правильного многоугольника',3,6,3),r=range(ctl,'radius','Радиус описанной окружности R',2,5,4);
  watch([n,r],()=>{const N=+n.value,R=+r.value,scale=22,vertices=Array.from({length:N},(_,i)=>circ(220,145,R*scale,90+360*i/N)),mid=[(vertices[0][0]+vertices[1][0])/2,(vertices[0][1]+vertices[1][1])/2];draw(`<circle cx="220" cy="145" r="${R*scale}" class="ocg-circle"/>`+poly(vertices)+line(220,145,...vertices[0],'ocg-blue')+line(220,145,...mid,'ocg-dashed')+point(220,145,'O')+label(220,275,`n = ${N}; R = ${R}`));out.textContent=`Сторона a ≈ ${fmt(2*R*Math.sin(Math.PI/N))}; расстояние от центра до стороны r ≈ ${fmt(R*Math.cos(Math.PI/N))}. R и r — разные отрезки.`;});
 }else if(kind==='power'){
  const offset=range(ctl,'offset','Смещение P от центра (радиус 5)',-3,3,1,.5);
  watch([offset],()=>{const p=+offset.value,x=220+20*p,h=Math.sqrt(25-p*p)*20;draw(`<circle cx="220" cy="145" r="100" class="ocg-circle"/>`+line(120,145,320,145)+line(x,145-h,x,145+h,'ocg-blue')+point(120,145,'A',-22,-8)+point(320,145,'B')+point(x,145-h,'C')+point(x,145+h,'D',8,22)+point(x,145,'P',8,20));out.textContent=`PA · PB = (${fmt(5+p)}) · (${fmt(5-p)}) = ${fmt(25-p*p)}. PC · PD = ${fmt(25-p*p)}. Обе хорды проходят через одну точку P внутри окружности.`;});
 }else if(kind==='area'){
  const a=range(ctl,'base','Нижнее основание',4,9,7),h=range(ctl,'height','Высота',2,5,4),shift=range(ctl,'shift','Сдвиг верхней стороны',-2,2,1,.5);
  const top=shape==='trap'?range(ctl,'top','Верхнее основание',2,6,4):null;
  watch([a,h,shift,...top?[top]:[]],()=>{const A=+a.value,H=+h.value,S=+shift.value,B=top?+top.value:A,x=65,y=235,k=25,verts=[[x,y],[x+A*k,y],[x+(S+B)*k,y-H*k],[x+S*k,y-H*k]];draw(poly(verts)+line(x+S*k,y-H*k,x+S*k,y,'ocg-dashed')+label(x+A*k/2,y+26,`a=${A}`)+label(x+S*k+18,y-H*k/2,`h=${H}`)+(top?label(x+(S+B/2)*k,y-H*k-10,`b=${B}`):''));out.textContent=top?`S = (a + b) · h : 2 = ${fmt((A+B)*H/2)}. Сдвиг не меняет оснований и высоты.`:`S = a · h = ${A*H}. Наклонная сторона может меняться; высота перпендикулярна основанию.`;});
 }else if(kind==='square'){
  const side=range(ctl,'side','Сторона квадрата a',2,8,5);
  watch([side],()=>{const a=+side.value,k=25,l=220-a*k/2,t=145-a*k/2,vertices=[[l,t],[l+a*k,t],[l+a*k,t+a*k],[l,t+a*k]];
   draw(poly(vertices)+line(...vertices[0],...vertices[2],'ocg-dashed')+vertices.map((p,i)=>point(...p,'ABCD'[i],i===0||i===3?-24:10,i>1?22:-8)).join('')+label(220,t-12,`a = ${a}`)+label(l+a*k+10,148,`a = ${a}`,'start')+label(220,279,`P = ${4*a}; S = ${a*a}`));
   out.textContent=`Все четыре стороны равны ${a}. P = 4a = ${4*a}, поэтому a = P : 4 = ${a}. Затем S = a² = ${a*a}. Диагональ d = a√2 ≈ ${fmt(a*Math.SQRT2)}. При движении ползунка фигура остаётся квадратом.`;
  });
 }else if(kind==='rhombArea'){
  const a=range(ctl,'diagonal1','Горизонтальная диагональ d₁',4,12,8),b=range(ctl,'diagonal2','Вертикальная диагональ d₂',4,8,6);let shown=false;
  const toggle=button('Достроить прямоугольник',()=>{shown=!shown;toggle.setAttribute('aria-pressed',String(shown));toggle.textContent=shown?'Убрать достроение':'Достроить прямоугольник';run();});toggle.setAttribute('aria-pressed','false');ctl.append(toggle);
  const run=()=>{const d1=+a.value,d2=+b.value,A=d1*12.5,B=d2*12.5,vertices=[[220-A,145],[220,145-B],[220+A,145],[220,145+B]];
   draw((shown?poly([[220-A,145-B],[220+A,145-B],[220+A,145+B],[220-A,145+B]],'ocg-complement'):'')+poly(vertices)+line(...vertices[0],...vertices[2],'ocg-blue')+line(...vertices[1],...vertices[3],'ocg-dashed')+label(220,145+B+28,`d₁ = ${d1}`)+label(240,120,`d₂ = ${d2}`,'start'));
   out.textContent=`Диагонали ромба: d₁ = ${d1}, d₂ = ${d2}. Прямоугольник со сторонами d₁ и d₂ имеет площадь ${d1*d2}. Ромб занимает его половину: S = d₁ · d₂ : 2 = ${d1*d2/2}. Четыре угловых треугольника вместе равны ромбу по площади.`;
  };watch([a,b],run);
 }else if(kind==='rhombHeight'){
  const side=range(ctl,'side','Сторона ромба a',3,7,5),angle=range(ctl,'angle','Острый угол ромба α, °',30,80,60,5);
  watch([side,angle],()=>{const a=+side.value,A=+angle.value,k=22,h=a*Math.sin(rad(A)),dx=a*Math.cos(rad(A))*k,x=45,y=235,w=a*k,vertices=[[x,y],[x+w,y],[x+w+dx,y-h*k],[x+dx,y-h*k]],cx=x+(w+dx)/2,cy=y-h*k/2;
   draw(poly(vertices)+line(x+dx,y-h*k,x+dx,y,'ocg-dashed')+line(cx,cy,cx,y,'ocg-blue')+point(cx,cy,'O',10,-8)+label(x+w/2,y+27,`a = ${a}`)+label(x+dx-10,y-h*k/2,`h`,'end')+label(cx+13,y-h*k/4,'ρ','start')+label(x+32,y-12,`${A}°`));
   out.textContent=`P = 4a = ${4*a}; a = P : 4 = ${a}. Высота h = a · sin α ≈ ${fmt(h)}. Площадь S = a · h ≈ ${fmt(a*h)}. Расстояние от центра O до стороны ρ = h : 2 ≈ ${fmt(h/2)}. Для тупого угла ${180-A}° синус такой же, как для ${A}°.`;
  });
 }else if(kind==='diagonal'){
  const a=range(ctl,'width',shape==='rect'||shape==='sq'?'Половина ширины прямоугольника':'Половина горизонтальной диагонали ромба',2,6,4),b=range(ctl,'height',shape==='rect'||shape==='sq'?'Половина высоты прямоугольника':'Половина вертикальной диагонали ромба',2,4,3);
  watch([a,b],()=>{const A=+a.value*25,B=+b.value*25;let vertices;
   if(shape==='rect'||shape==='sq')vertices=[[220-A,145-B],[220+A,145-B],[220+A,145+B],[220-A,145+B]];
   else vertices=[[220-A,145],[220,145-B],[220+A,145],[220,145+B]];
   draw(poly(vertices)+line(...vertices[0],...vertices[2],'ocg-blue')+line(...vertices[1],...vertices[3],'ocg-dashed')+point(220,145,'O')+vertices.map((p,i)=>point(...p,'ABCD'[i],8,i>1?22:-8)).join(''));
   out.textContent=shape==='rect'||shape==='sq'?`Это прямоугольник: диагонали равны и делятся пополам. Каждая ≈ ${fmt(2*Math.hypot(+a.value,+b.value))}. Квадрат получится, когда стороны равны.`:`Это ромб: диагонали ${2*a.value} и ${2*b.value} перпендикулярны и делятся пополам. Они могут иметь разные длины.`;
  });
 }else if(kind==='angles'){
  const a=range(ctl,'angle','Острый угол параллелограмма, °',35,85,60);
  watch([a],()=>{const A=+a.value,dx=100/Math.tan(rad(A));draw(poly([[45,235],[245,235],[245+dx,135],[45+dx,135]])+label(79,218,`${A}°`)+label(220,218,`${180-A}°`)+label(70+dx,125,`${180-A}°`)+label(240+dx,125,`${A}°`));out.textContent=`Соседние углы: ${A}° + ${180-A}° = 180°. Противоположные углы равны. Причина — параллельность противоположных сторон.`;});
 }else if(kind==='gridLength'){
  const a=range(ctl,'horizontal','Горизонтальный шаг, клеток',1,8,4),b=range(ctl,'vertical','Вертикальный шаг, клеток',1,6,3);
  watch([a,b],()=>{let g='';for(let x=35;x<=395;x+=30)g+=line(x,25,x,265,'ocg-grid');for(let y=25;y<=265;y+=30)g+=line(35,y,395,y,'ocg-grid');const x=65+30*a.value,y=235-30*b.value;draw(g+line(65,235,x,235,'ocg-dashed')+line(x,235,x,y,'ocg-dashed')+line(65,235,x,y,'ocg-blue')+point(65,235,'A',-20,22)+point(x,y,'B')+label((65+x)/2,260,a.value)+label(x+18,(235+y)/2,b.value));out.textContent=`По прямой AB = √(${a.value}² + ${b.value}²) ≈ ${fmt(Math.hypot(+a.value,+b.value))}. Число клеток вдоль ломаной — другая длина. Тангенс угла при A равен вертикальному шагу, делённому на горизонтальный: ${fmt(b.value/a.value)}.`;});
 }else if(kind==='gridArea'){
  const a=range(ctl,'base','Основание треугольника, клеток',3,9,6),h=range(ctl,'height','Высота, клеток',2,6,4);let shown=false;
  const toggle=button('Достроить прямоугольник',()=>{shown=!shown;toggle.setAttribute('aria-pressed',String(shown));toggle.textContent=shown?'Убрать достроение':'Достроить прямоугольник';run();});toggle.setAttribute('aria-pressed','false');ctl.append(toggle);
  const run=()=>{const x=65+30*a.value,y=235-30*h.value;let g='';for(let X=35;X<=395;X+=30)g+=line(X,25,X,265,'ocg-grid');for(let Y=25;Y<=265;Y+=30)g+=line(35,Y,395,Y,'ocg-grid');draw(g+(shown?poly([[65,235],[x,235],[x,y],[65,y]],'ocg-complement'):'')+poly([[65,235],[x,235],[65,y]])+label((65+x)/2,260,`a=${a.value}`)+label(45,(235+y)/2,`h=${h.value}`));out.textContent=`Прямоугольник: ${a.value} · ${h.value} = ${a.value*h.value} клеток². Треугольник занимает половину: ${a.value*h.value/2} клеток².`;};watch([a,h],run);
 }else if(kind==='midline'){
  const a=range(ctl,'base','Нижнее основание',4,10,8),b=range(ctl,'top',shape==='trap'?'Верхнее основание':'Верхняя вершина: смещение',shape==='trap'?2:0,shape==='trap'?6:4,shape==='trap'?4:2);let shown=false;
  const toggle=button('Показать среднюю линию',()=>{shown=!shown;toggle.setAttribute('aria-pressed',String(shown));run();});toggle.setAttribute('aria-pressed','false');ctl.append(toggle);
  const run=()=>{const A=+a.value,B=shape==='trap'?+b.value:0,left=shape==='trap'?2:+b.value,k=27,x=60,mid1=[x+left*k/2,160],mid2=[x+(A+left+B)*k/2,160];draw(poly([[x,235],[x+A*k,235],[x+(left+B)*k,85],[x+left*k,85]])+(shown?line(...mid1,...mid2,'ocg-blue'):'')+label(x+A*k/2,263,`a=${A}`)+(B?label(x+(left+B/2)*k,65,`b=${B}`):''));out.textContent=shown?`Средняя линия соединяет середины боковых сторон. Её длина ${B?'(a + b) : 2':'a : 2'} = ${(A+B)/2}.`:'Найди середину каждой боковой стороны. Какой отрезок их соединяет?';};watch([a,b],run);
 }else{
  const k=range(ctl,'scale','Коэффициент подобия',1,3,2,.25);
  watch([k],()=>{const K=+k.value,s=38;draw(poly([[25,240],[25+s,240],[25,240-s]])+poly([[150,240],[150+s*K,240],[150,240-s*K]])+label(46,270,'1')+label(150+s*K/2,270,fmt(K)));out.textContent=`Длины увеличились в ${fmt(K)} раза; площади — в ${fmt(K*K)} раза. Для кругов действует та же связь: площадь зависит от квадрата радиуса.`;});
 }
 return host;
}
const refs16={insc:['circleAngle',['inscribed_angles'],[]],radiso:['circleAngle',['isosceles','circle_definition'],[]],cyclq:['cyclic',['inscribed_angles','circumcircle'],[]],reg:['regular',['regular_polygon'],['equilateral-triangle']],sinr:['sine',['circumcircle','trigonometry'],['sine-cosine']],chord:['chord',['equal_chords','pythagoras'],['pythagoras']],spr:['incircle',['incircle','triangle_area'],['triangle-area']],tangq:['tangent',['tangent','incircle'],[]],tang:['tangent',['tangent'],[]],power:['power',['triangle_similarity','inscribed_angles'],[]]};
const refs17={sqf:['square',['square','pythagoras'],['pythagoras']],rectd:['diagonal',['rectangle','pythagoras'],['pythagoras']],rhombprop:['diagonal',['rhombus'],[]],parprop:['angles',['parallelogram'],[]],parallel:['angles',['parallel_angles'],[]],anglesum:['angles',['polygon_angles'],['polygon-angles']],isotri:['isosceles',['isosceles'],[]],isotrap:['trapezoidAngles',['isosceles_trapezoid'],[]],simtri:['ratio',['triangle_similarity'],[]],spar:['area',['parallelogram_area'],['parallelogram-area']],srhomb:['diagonal',['rhombus_area'],['rhombus-area']],strap:['area',['trapezoid_area'],['trapezoid-area']]};
const refs18={pyth:['gridLength',['pythagoras'],['pythagoras']],midtri:['midline',['triangle_midline'],['midlines']],midtrap:['midline',['trapezoid_midline'],['midlines']],stri:['gridArea',['triangle_area'],['triangle-area']],spar:['area',['parallelogram_area'],['parallelogram-area']],srhomb:['diagonal',['rhombus_area'],['rhombus-area']],strap:['area',['trapezoid_area'],['trapezoid-area']],tan:['gridLength',['trigonometry'],['pythagoras','trig-values']],sim:['ratio',['triangle_similarity'],[]],circ:['ratio',['circle_length_area','similarity_area'],['circle']],cells:['gridArea',['equal_area','triangle_area'],['triangle-area']]};
function current(){
 if(page===16&&typeof trTask!=='undefined'&&trTask)return{key:trTask.k,text:trTask.text,law:trTask.sub.law,ref:trTask.sub.ref,shape:'',task:trTask};
 if(page===17&&typeof CUR!=='undefined'&&CUR)return{key:CUR.key,text:CUR.text,law:CUR.law,ref:CUR.ref,shape:CUR.topic,task:CUR};
 if(page===18&&typeof TR!=='undefined'&&TR.task)return{key:TR.task.sub,text:TR.task.text,law:typeof REF!=='undefined'&&REF[TR.task.ref]?REF[TR.task.ref].t:'',ref:TR.task.ref,shape:TR.task.ref==='midtrap'||TR.task.ref==='strap'?'trap':'',task:TR.task};
 return null;
}
function config(info){if(page===16&&info.key==='sqCircum')return ['squareIncircle',['square','incircle'],[]];if(page===17&&info.key==='trapMidSeg')return ['trapezoidMidSegments',['triangle_midline','trapezoid_midline'],['midlines']];if(page===16&&info.key==='tanChord')return ['tangentChord',['tangent','inscribed_angles'],[]];if(info.ref==='srhomb'&&((page===17&&info.key==='rhombAreaDiag')||(page===18&&info.key==='areaRhomb')))return ['rhombArea',['rhombus_area'],['rhombus-area']];if(page===17&&['rhombHeight','rhombAreaPerim','rhombAreaDist'].includes(info.key))return ['rhombHeight',['rhombus_area','trigonometry'],['rhombus-area','trig-values']];return (page===16?refs16:page===17?refs17:refs18)[info.ref]||['gridLength',['pythagoras'],['pythagoras']];}
function answerInstruction(info){
 const d=doc.createElement('div');d.innerHTML=info.text;const text=d.textContent;
 if(info.task.ansFmt==='concat')return 'Найди длины и запиши их подряд в порядке, который указан в условии.';
 const sentences=text.split(/(?<=[.!?])\s+/);let ask=sentences.filter(s=>/найд|определ|вычисл|чему рав/i.test(s)).pop()||'Найди величину, которую спрашивают в условии.';
 ask=ask.replace(/^.*?(?=Найдите|Найди|Определите|Вычислите)/,'').trim();
 const unit=/градус/i.test(text)?' Запиши число градусов без значка °.':/площад/i.test(ask)?' Запиши числовое значение площади в единицах условия.':/отношени|тангенс|косинус|синус/i.test(ask)?' Запиши число.':' Запиши число в единицах условия.';
 return ask+unit;
}
function preserveDraft(input,identity){
 const stored=memories.get(identity);if(stored!=null&&!input.value)input.value=stored;
 input.addEventListener('input',()=>{memories.set(identity,input.value);if(memories.size>100)memories.delete(memories.keys().next().value);});
}
function references(host,topics,crops){
 if(global.OgeCourseReference){global.OgeCourseReference.topicCards(host,topics);global.OgeCourseReference.sheetCards(host,crops);}
 else{const p=el('p','Справочные материалы: '),a=el('a','официальная страница ФИПИ');a.href='https://fipi.ru/oge/demoversii-specifikacii-kodifikatory';a.target='_blank';a.rel='noopener';p.append(a);host.append(p);}
}
function enhance(){
 const panel=q('#courseHintPanel'),toggle=q('#courseHintToggle'),input=q(page===18?'#ansIn':'#ans'),info=current();
 if(!panel||!toggle||!input||!info||panel.dataset.geometryReady)return;
 panel.dataset.geometryReady='1';doc.body.classList.add('ocg-page');
 const identity=page+'|'+info.key+'|'+info.text;
 input.setAttribute('aria-label',answerInstruction(info));preserveDraft(input,identity);
 const prompt=el('label',answerInstruction(info),'ocg-answer-label');prompt.htmlFor=input.id;input.parentElement.before(prompt);
 const [kind,topics,crops]=config(info),explore=details('Помочь разобраться на модели?');explore.dataset.geometryDiscovery='1';model(explore,kind,info.shape);panel.prepend(explore);
 const applied=details('Как применить это к моему заданию?');applied.append(el('p','1. Найди на своём рисунке отрезки или углы, о которых говорит правило.'),el('p','2. Сверь все условия правила: прямой угол, параллельность, касание или положение точек.'),el('p','3. Подставь данные своей задачи. Запиши ответ в поле под условием.'));const law=el('div',null,'ocg-law');law.innerHTML=info.law;applied.append(law);panel.append(applied);
 const referenceBox=el('section',null,'ocg-reference-box');references(referenceBox,topics,crops);panel.append(referenceBox);
 const returnButton=button('Вернуться к моему ответу',()=>{if(!panel.hidden)toggle.click();input.focus();});panel.append(returnButton);
 const update=()=>toggle.textContent=panel.hidden?'Хочешь подсказку?':'Убрать подсказку';toggle.addEventListener('click',update);update();
 // Same-page references must not replace the task or discard its typed answer.
 const main=q('#main');if(main&&!main.dataset.geometryReferences){main.dataset.geometryReferences='1';main.addEventListener('click',event=>{const link=event.target.closest('.refcall,[data-act="ref"],#toRef2,#toSheet2');if(!link||!q('#courseHintPanel'))return;event.preventDefault();event.stopImmediatePropagation();const live=q('#courseHintPanel');if(live.hidden)q('#courseHintToggle').click();const box=q('.ocg-reference-box',live);if(box){all('details',box).forEach(d=>d.open=true);box.scrollIntoView?.({block:'nearest'});q('summary',box)?.focus();}},true);}
 for(const figure of all('#main .diagram,#main .fig,#main .figwrap')){if(figure.closest('#courseHintPanel'))continue;figure.classList.add('ocg-primary-figure');
  const svg=q('svg',figure);if(svg){const vb=(svg.getAttribute('viewBox')||'0 0 440 290').split(/\s+/).map(Number),fonts=all('text',svg).map(t=>+t.getAttribute('font-size')).filter(n=>n>0),smallest=fonts.length?Math.min(...fonts):18;svg.style.width=Math.max(440,vb[2]*Math.max(1,18/smallest))+'px';svg.style.maxWidth='none';}
  figureNavigation(figure,'Чертёж к условию');
 }
 doc.documentElement.dataset.ogeGeometry='ready';
}
function lesson15(){
 const article=q('article.task'),figure=q('.diagram'),hint=q('#hintPanel');if(!article||!figure||!hint)return;
 doc.body.classList.add('ocg-page');
 // The given diagram is part of the task. The explanation stays in the help.
 const originalCaption=q('figcaption',figure);if(originalCaption)q('.hint-body',hint).prepend(originalCaption);
 const relation=q('.fig-sum',figure);if(relation)relation.remove();hint.before(figure);figure.classList.add('ocg-primary-figure');figureNavigation(figure,'Чертёж к условию');
 const form=el('div',null,'ocg-lesson-answer'),lab=el('label','Чему равен внешний угол при вершине C? Запиши число градусов без значка °.','ocg-answer-label'),input=el('input'),fb=el('p',null,'ocg-feedback');input.id='ocg15-answer';input.inputMode='decimal';input.autocomplete='off';lab.htmlFor=input.id;fb.setAttribute('role','status');
 const check=button('Проверить',()=>{const value=input.value.trim().replace(',','.');if(!/^\d+(?:\.\d+)?$/.test(value)){fb.textContent='Запиши число градусов, например 25.';return;}fb.textContent=+value===38?'Верно. Внешний угол равен 38°.':'Пока не совпало. Посмотри, какие два угла вместе образуют развёрнутый угол.';});input.addEventListener('keydown',e=>{if(e.key==='Enter')check.click();});form.append(lab,input,check,fb);hint.before(form);preserveDraft(input,'15|external142');
 const explore=details('Проверить на подвижной модели?');model(explore,'adjacent');q('.hint-body',hint).prepend(explore);
 const ref=el('section',null,'ocg-reference-box');references(ref,['adjacent_vertical','triangle_exterior'],[]);q('.hint-body',hint).append(ref,button('Вернуться к моему ответу',()=>{hint.open=false;input.focus();}));
 const summary=q('summary',hint);hint.addEventListener('toggle',()=>summary.textContent=hint.open?'Убрать подсказку':'Хочешь подсказку?');
 doc.documentElement.dataset.ogeGeometry='ready';
}
if(page===15)lesson15();
else{if(page===18&&typeof drawTrain==='function'){const native=drawTrain;drawTrain=function(){const result=native.apply(this,arguments);enhance();return result;};}else if(typeof renderTrain==='function'){const native=renderTrain;renderTrain=function(){const result=native.apply(this,arguments);enhance();return result;};}enhance();}
// Only semantic controls are shared; figures and explanatory text are rebuilt locally.
function activeModel(){return q('#courseHintPanel [data-geometry-model]');}
function modelState(host){
 if(!host)return null;
 return {kind:host.dataset.geometryModel,open:host.open===true,controls:Object.fromEntries(all('[data-geometry-control]',host).map(input=>[input.dataset.geometryControl,+input.value])),toggles:all('.ocg-controls button[aria-pressed]',host).map(b=>b.getAttribute('aria-pressed')==='true')};
}
function validateModelState(state,host){
 if(!host)return state===null;
 if(!state||typeof state!=='object'||Array.isArray(state)||Object.keys(state).sort().join(',')!=='controls,kind,open,toggles'||state.kind!==host.dataset.geometryModel||typeof state.open!=='boolean')return false;
 if(!state.controls||typeof state.controls!=='object'||Array.isArray(state.controls)||!Array.isArray(state.toggles))return false;
 const inputs=all('[data-geometry-control]',host),keys=inputs.map(i=>i.dataset.geometryControl).sort(),given=Object.keys(state.controls).sort();
 if(keys.join(',')!==given.join(','))return false;
 for(const input of inputs){const value=state.controls[input.dataset.geometryControl],min=+input.min,max=+input.max,step=+input.step||1;if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max||Math.abs((value-min)/step-Math.round((value-min)/step))>1e-7)return false;}
 const toggles=all('.ocg-controls button[aria-pressed]',host);return state.toggles.length===toggles.length&&state.toggles.every(v=>typeof v==='boolean');
}
function captureState(){return modelState(activeModel());}
function validateState(state,expected){
 if(expected===undefined)return validateModelState(state,activeModel());
 if(!expected||typeof expected.kind!=='string'||!Object.prototype.hasOwnProperty.call(captions,expected.kind))return false;
 // A detached model supports validating the next task before any current state changes.
 return validateModelState(state,model(el('details'),expected.kind,expected.shape));
}
function applyState(state){
 const host=activeModel();if(!validateModelState(state,host))return false;if(!host)return true;
 for(const input of all('[data-geometry-control]',host)){const value=state.controls[input.dataset.geometryControl];if(+input.value!==value){input.value=String(value);input.dispatchEvent(new global.Event('input',{bubbles:true}));}}
 all('.ocg-controls button[aria-pressed]',host).forEach((b,i)=>{if((b.getAttribute('aria-pressed')==='true')!==state.toggles[i])b.click();});
 if(host.open!==state.open)host.open=state.open;
 return true;
}
global.OgeGeometryDiscovery={config,answerInstruction,model,enhance,captureState,validateState,applyState};
})(window);
