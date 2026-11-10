/* Exact exploratory models. A measured example is not a proof of a theorem. */
(function(root){
'use strict';
const names={'triangle-signs':'signs','similarity-signs':'similar','inscribed':'diameter','chords-tangent':'tangent','area-triangle':'height'};
const E=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const line=(a,b,color='#326ab3',dash='')=>`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${color}" stroke-width="2.5" ${dash?'stroke-dasharray="5 4"':''}/>`;
const text=(p,t)=>`<text x="${p[0]}" y="${p[1]}" font-size="16" fill="#183044">${E(t)}</text>`;
const poly=(p,c='#147c78')=>`<polygon points="${p.map(x=>x.join(',')).join(' ')}" fill="${c}" fill-opacity=".12" stroke="${c}" stroke-width="2.5"/>`;
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1],sub=(a,b)=>a.map((x,i)=>x-b[i]);
const dist=(a,b)=>Math.hypot(...sub(a,b));
function model(kind,value){
 const n=Number(value),rad=n*Math.PI/180;
 if(kind==='diameter'){const A=[-1,0],B=[1,0],C=[Math.cos(rad),Math.sin(rad)];return {A,B,C,dot:dot(sub(A,C),sub(B,C)),valid:n>0&&n<180};}
 if(kind==='height')return {A:[0,0],B:[6,0],C:[n,4],H:[n,0],area:12,outside:n<0||n>6};
 if(kind==='similar'){const p=[[0,0],[4,0],[1,3]],q=p.map(a=>a.map(x=>x*n));return {p,q,k:n,lengthRatio:Math.abs(n),areaRatio:n*n,valid:n!==0};}
 if(kind==='tangent')return {r:60,d:n,count:n>60?0:n===60?1:2,halfChord:n<=60?Math.sqrt(3600-n*n):null};
 const p=[[0,0],[6,0],[2,4]],q=p.map(([x,y])=>[x*Math.cos(rad)+y*Math.sin(rad),x*Math.sin(rad)-y*Math.cos(rad)]);return {p,q,sides:p.map((v,i)=>dist(v,p[(i+1)%3]))};
}
function task(kind,seed){
 const n=Math.abs(Math.trunc(seed)),v=n%6;
 let question,answer,steps,figure;
 if(kind==='signs'){
  const order=['DEF','DFE','EDF','EFD','FDE','FED'][v],[p,q,r]=order,mode=Math.floor(n/6)%3,a=4+Math.floor(n/18)%5;
  const given=mode===0?`AB = ${p+q} = ${a}; ∠A = ∠${p} = 50°, ∠B = ∠${q} = 60°`:mode===1?`AB = ${p+q} = ${a}, AC = ${p+r} = ${a+1}, BC = ${q+r} = ${a+2}`:`∠A = ∠${p} = 50°, ∠B = ∠${q} = 60°, ∠C = ∠${r} = 70°`;
  answer=mode===0?'2':mode===1?'3':'0';question=`В треугольниках ABC и DEF дано: ${given}. Какой признак равенства применим: 2, 3 или 0 (данных недостаточно)?`;
  steps=[{question:'Есть ли хотя бы одна пара данных равных сторон? Ответь «да» или «нет».',answer:mode===2?'нет':'да',reason:'Равенство только углов определяет форму, но не размер треугольника.'},{question:'Запиши номер подходящего признака равенства: 2, 3 или 0.',answer,reason:mode===0?'Сторона и два прилежащих к ней угла задают второй признак.':mode===1?'Три пары соответствующих сторон задают третий признак.':'Три равных угла гарантируют подобие, но треугольники могут иметь разный размер.'}];
  figure={kind:'triangles',scale:mode===2?1.25:1,labels:order};
 }else if(kind==='similar'){
  const a=3+v,k=2+Math.floor(n/6)%3,area=5+Math.floor(n/18)%8;
  question=`Треугольники ABC и DEF подобны: A ↔ D, B ↔ E, C ↔ F. AB = ${a} см, DE = ${a*k} см, площадь ABC равна ${area} см². Найди площадь DEF в см².`;answer=area*k*k;
  steps=[{question:'Во сколько раз DE больше соответствующей AB?',answer:k,reason:'Сравниваем соответствующие стороны в одном направлении: DE / AB.'},{question:'Во сколько раз площадь DEF больше площади ABC?',answer:k*k,reason:'При подобии площадь меняется в квадрат коэффициента подобия.'},{question:'Найди площадь DEF.',answer,reason:`Площадь ABC умножаем на ${k}².`}];figure={kind:'triangles',scale:1.25,labels:'DEF'};
 }else if(kind==='diameter'){
  const a=20+5*v+Math.floor(n/6)%5;
  question=`AB — диаметр окружности, C лежит на окружности и не совпадает с A и B. ∠CAB = ${a}°. Найди ∠ABC в градусах.`;answer=90-a;
  steps=[{question:'Чему равен угол ACB, опирающийся на диаметр?',answer:90,reason:'Вписанный угол равен половине дуги, на которую он опирается: 180° / 2.'},{question:'Вычти из 180° два известных угла. Найди угол ABC.',answer,reason:`180° − 90° − ${a}° = ${answer}°.`}];figure={kind:'diameter',value:2*a};
 }else if(kind==='tangent'){
  const angle=20+5*v+Math.floor(n/6)%5;
  question=`Из P проведена касательная PT к окружности с центром O; T — точка касания. ∠TOP = ${angle}°. Найди ∠OPT в градусах.`;answer=90-angle;
  steps=[{question:'Чему равен угол OTP в градусах?',answer:90,reason:'Радиус в точке касания перпендикулярен касательной.'},{question:'Используй сумму углов треугольника OTP. Найди угол OPT.',answer,reason:`180° − 90° − ${angle}° = ${answer}°.`}];figure={kind:'tangentTask',angle};
 }else{
  const a=4+v,h=3+Math.floor(n/6)%6;
  question=`В треугольнике ABC основание AB = ${a} см. Высота CH = ${h} см, H лежит на продолжении AB за точкой A. Найди площадь ABC в см².`;answer=a*h/2;
  steps=[{question:'Какую высоту нужно использовать для основания AB?',answer:h,reason:'Высота — расстояние от C до всей прямой AB, даже если H вне отрезка AB.'},{question:'Найди половину произведения основания на высоту.',answer,reason:`S = AB · CH / 2 = ${a} · ${h} / 2.`}];figure={kind:'height',value:-2};
 }
 return {question,answer,steps,figure};
}
function figure(t){
 const f=t.figure;let s='';
 if(f.kind==='triangles'){const p=[[35,105],[155,105],[75,25]],q=[[385,120],[385-120*f.scale,120],[385-40*f.scale,120-80*f.scale]];s=poly(p)+poly(q,'#326ab3')+p.map((x,i)=>text([x[0]-10,x[1]+(i===2?-8:20)],'ABC'[i])).join('')+q.map((x,i)=>text([x[0]-10,x[1]+(i===2?-8:20)],f.labels[i])).join('');}
 if(f.kind==='diameter'){const m=model('diameter',f.value),p=x=>[200+x[0]*95,115-x[1]*95];s=`<circle cx="200" cy="115" r="95" fill="none" stroke="#94a7bb"/>`+poly([p(m.A),p(m.B),p(m.C)])+text([90,132],'A')+text([297,132],'B')+text([p(m.C)[0],p(m.C)[1]-8],'C');}
 if(f.kind==='height'){const p=[[160,120],[330,120],[60,20]],H=[60,120];s=poly(p)+line([35,120],[350,120],'#94a7bb',true)+line(p[2],H,'#d68230')+text([145,140],'A')+text([330,140],'B')+text([45,18],'C')+text([40,140],'H');}
 if(f.kind==='tangentTask'){const T=[270,120],O=[270,30],P=[270-90*Math.tan(f.angle*Math.PI/180),120];s=poly([O,T,P])+text([O[0]+7,O[1]],'O')+text([T[0]+7,T[1]+18],'T')+text([P[0]-10,P[1]+18],'P')+line([T[0]-8,T[1]],[T[0]-8,T[1]-8],'#d68230')+line([T[0]-8,T[1]-8],[T[0],T[1]-8],'#d68230');}
 const isCircle=f.kind==='diameter';return `<svg viewBox="0 0 420 ${isCircle?220:150}" style="width:100%;max-height:170px" role="img" aria-label="Схема к условию. Используй данные из текста.">${s}</svg><p class="muted">Схема условия; размеры бери из текста.</p>`;
}
const configs={
 signs:{title:'Равенство сохраняется при повороте и отражении',prompt:'Треугольник повернули и отразили. Сохранились три стороны. Изменится ли его размер?',options:[['no','Нет, размер тот же'],['yes','Да, размер изменится']],correct:'no',min:0,max:180,step:1,value:35,label:'Поворот второго треугольника, °'},
 similar:{title:'Подобие: длина и площадь',prompt:'Если увеличить все стороны вдвое, площадь увеличится…',options:[['two','в 2 раза'],['four','в 4 раза'],['same','не изменится']],correct:'four',min:.5,max:2,step:.05,value:1,label:'Коэффициент подобия k'},
 diameter:{title:'Вписанный угол, опирающийся на диаметр',prompt:'C движется по полуокружности, A и B — концы диаметра. Как изменится угол ACB?',options:[['fixed','Останется прямым'],['change','Будет меняться']],correct:'fixed',min:10,max:170,step:1,value:60,label:'Положение C на полуокружности, °'},
 tangent:{title:'Когда прямая касается окружности?',prompt:'Расстояние от центра до прямой равно радиусу. Сколько общих точек?',options:[['one','Одна'],['two','Две'],['zero','Ни одной']],correct:'one',min:0,max:100,step:1,value:60,label:'Расстояние d от центра до прямой; радиус 60'},
 height:{title:'Высота может лежать вне треугольника',prompt:'C движется по прямой, параллельной AB. Высота та же, основание то же. Изменится ли площадь?',options:[['same','Нет, останется той же'],['change','Да, изменится']],correct:'same',min:-3,max:9,step:.1,value:-2,label:'Положение основания высоты H на прямой AB (A=0, B=6)'}
};
function experiment(kind,el,saved,onChange){
 const c=configs[kind],parts=String(saved||'').split('~'),valid=c.options.some(x=>x[0]===parts[0]);let value=Number(parts[1]);if(!Number.isFinite(value)||value<c.min||value>c.max)value=c.value;
 el.innerHTML=`<section class="experiment"><h2>${c.title}</h2><p>${c.prompt}</p><form class="investigation-predict"><label>Мой прогноз <select required><option value="">Выбери ответ</option>${c.options.map(x=>`<option value="${x[0]}">${x[1]}</option>`).join('')}</select></label><button class="primary">Проверить на модели</button></form><div class="investigation-model" hidden><p class="feedback" role="status"></p><svg viewBox="0 0 420 220" style="max-height:220px" role="img" aria-label="${c.title}"></svg><label>${c.label}<input type="range" min="${c.min}" max="${c.max}" step="${c.step}" value="${value}" aria-label="${c.label}"></label><output aria-live="polite"></output><p class="muted">Меняй одно значение и сравнивай. Наблюдение помогает сформулировать догадку; общий вывод обоснуй в следующем шаге.</p></div></section>`;
 const form=el.querySelector('form'),select=el.querySelector('select'),container=el.querySelector('.investigation-model'),range=el.querySelector('input'),svg=el.querySelector('svg'),out=el.querySelector('output');
 function draw(){const v=+range.value,m=model(kind,v);let s='',result='';
  if(kind==='signs'){const p=m.p.map(([x,y])=>[45+18*x,155-18*y]),center=m.q.reduce((a,b)=>[a[0]+b[0]/3,a[1]+b[1]/3],[0,0]),q=m.q.map(([x,y])=>[300+18*(x-center[0]),110-18*(y-center[1])]);s=poly(p)+poly(q,'#326ab3')+p.map((x,i)=>text([x[0]-10,x[1]+18],'ABC'[i])).join('')+q.map((x,i)=>text([x[0]-10,x[1]+18],'DEF'[i])).join('');result='Соответствующие стороны равны: '+m.sides.map(x=>x.toFixed(2)).join('; ')+'. Положение на листе не входит в условия признака.';}
  if(kind==='similar'){const p=m.p.map(([x,y])=>[25+23*x,180-23*y]),q=m.q.map(([x,y])=>[195+23*x,180-23*y]);s=poly(p)+poly(q,'#326ab3');result=`Длины: ×${v.toFixed(2)}. Площади: ×${m.areaRatio.toFixed(2)}. При k=2 площадь увеличивается в 4 раза.`;}
  if(kind==='diameter'){const p=x=>[210+85*x[0],120-85*x[1]];s=`<circle cx="210" cy="120" r="85" fill="none" stroke="#94a7bb"/>`+poly([p(m.A),p(m.B),p(m.C)])+text([110,141],'A')+text([300,141],'B')+text([p(m.C)[0]+5,p(m.C)[1]-6],'C');result='∠ACB = 90°. Не выбирай C=A или C=B: тогда треугольник вырождается.';}
  if(kind==='tangent'){s=`<circle cx="135" cy="110" r="60" fill="none" stroke="#147c78"/>`+line([135+m.d,15],[135+m.d,205])+line([135,110],[135+m.d,110],'#d68230');if(m.count)s+=Array.from({length:m.count},(_,i)=>`<circle cx="${135+m.d}" cy="${110+(i?-1:1)*m.halfChord}" r="4" fill="#d68230"/>`).join('');result=`d=${v}, r=60. Общих точек: ${m.count}. ${m.count===1?'Радиус к точке касания перпендикулярен прямой.':m.count===2?'Это секущая.':'Прямая вне окружности.'}`;}
  if(kind==='height'){const p=x=>[115+22*x[0],170-22*x[1]];s=line([30,170],[390,170],'#94a7bb',true)+poly([p(m.A),p(m.B),p(m.C)])+line(p(m.C),p(m.H),'#d68230')+line([p(m.H)[0],162],[p(m.H)[0]+8,162],'#d68230')+line([p(m.H)[0]+8,162],[p(m.H)[0]+8,170],'#d68230')+text([102,190],'A')+text([249,190],'B')+text([p(m.C)[0]+6,p(m.C)[1]-5],'C')+text([p(m.H)[0]-7,210],'H');result=`AB=6, CH=4, S=12. H ${m.outside?'вне отрезка AB':'на отрезке AB'}; высота проведена к прямой AB.`;}
  svg.innerHTML=s;out.textContent=result;
 }
 function publish(){onChange(select.value+'~'+range.value);}
 form.addEventListener('submit',e=>{e.preventDefault();if(!select.value)return;container.hidden=false;select.disabled=true;form.querySelector('button').disabled=true;el.querySelector('.feedback').textContent=select.value===c.correct?'Прогноз подтверждается моделью. Теперь проверь другие положения.':'Сравни прогноз с моделью. Измени положение и объясни, какое условие сохраняется.';publish();draw();});
 range.addEventListener('input',()=>{draw();publish();});
 if(valid){select.value=parts[0];select.disabled=true;form.querySelector('button').disabled=true;container.hidden=false;el.querySelector('.feedback').textContent='Сохранённый прогноз. Продолжай исследование.';draw();}
}
function forUnit(id){
 const kind=names[id];if(!kind)return null;
 const prefix='iv1:'+kind+':';
 return {
  title:configs[kind].title,placeholder:'Число или номер признака',answerHelp:kind==='signs'?'2 — сторона и два прилежащих угла; 3 — три стороны; 0 — данных недостаточно.':'Введи число. Можно записать дробь, например 3/2.',
  task:seed=>task(kind,seed),figure,check:(v,e,eq)=>eq(v,e),
  feedback:()=>kind==='signs'?'Проверь, есть ли равная сторона. Три угла задают только подобие; для второго признака углы должны прилежать к данной стороне.':kind==='similar'?'Сначала найди отношение соответствующих сторон. Для площадей это отношение нужно возвести в квадрат.':kind==='diameter'?'Вписанный угол при C опирается на диаметр и равен 90°. Используй сумму трёх углов треугольника.':kind==='tangent'?'Радиус к точке касания перпендикулярен касательной. Сумма трёх углов треугольника равна 180°.':'Высота опускается к прямой AB, а не обязательно внутрь отрезка. Площадь — половина произведения основания и высоты.',
  experiment:(el,saved,onChange)=>experiment(kind,el,saved,onChange),
  progress(record){const marker=record?.events.findLast(e=>e.type.startsWith(prefix));if(!marker)return null;const p=marker.type.slice(prefix.length).split(':');const count=Number(p[0]);return {verified:Number.isFinite(count)?Math.min(1e6,Math.max(0,Math.trunc(count))):0,legacy:p[1]==='1',prediction:p.slice(2).join(':')};},
  persist(state){const v=state.congruence;state.events=state.events.filter(e=>!e.type.startsWith(prefix));state.events.push({type:prefix+v.verified+':'+(v.legacy?'1':'0')+':'+v.prediction,time:Date.now()});}
 };
}
root.GeoInvestigations={forUnit,model,task,units:Object.keys(names)};
})(typeof window!=='undefined'?window:globalThis);
