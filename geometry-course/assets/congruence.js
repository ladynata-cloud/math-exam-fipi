/* Pilot for the first triangle congruence criterion. */
(function(root){
'use strict';
const rotations=['DEF','DFE','EDF','EFD','FDE','FED'];
function task(seed){
 const index=Math.abs(seed)%rotations.length, order=rotations[index];
 const [p,q,r]=order, a=4+(seed%5), b=a+2, between=Math.floor(seed/rotations.length)%2===0;
 const angle=between?p:q, answer=between?['1',order]:['0','—'];
 const question='В треугольниках ABC и DEF: AB = '+p+q+' = '+b+' см, AC = '+p+r+' = '+a+' см, ∠'+(between?'A':'B')+' = ∠'+angle+' = 30°. Можно ли применить первый признак? Запиши номер и порядок соответствующих вершин.';
 const steps=[
  {question:'Какая вершина в ABC соединяет обе данные стороны?',answer:'A',reason:'Стороны AB и AC имеют общую вершину A. Во втором треугольнике общая вершина — '+p+'.'},
  {question:'Дан угол между двумя равными сторонами в каждом треугольнике? Ответь «да» или «нет».',answer:between?'да':'нет',reason:between?'Оба данных угла при общих концах сторон.':'Даны углы при других вершинах, поэтому первый признак здесь не применяется.'},
  {question:'Запиши ответ: 1 и три вершины в порядке, соответствующем ABC, или 0 и прочерк.',answer,reason:between?'Сначала сопоставь вершины углов A и '+p+', затем концы равных сторон AB и '+p+q+', AC и '+p+r+'.':'Двух сторон и угла напротив одной из них в общем случае недостаточно.'}
 ];
 return {question,answer,steps,order,between,a,b};
}
function parse(value){
 const parts=String(value).trim().toUpperCase().replace(/[АВСДЕФ]/g,l=>({А:'A',В:'B',С:'C',Д:'D',Е:'E',Ф:'F'}[l])).split(/[;,\s]+/u);
 return [parts[0],parts.slice(1).join('').replace(/[−–-]/g,'—')];
}
function check(value,expected,normalEqual){
 if(!Array.isArray(expected))return normalEqual(expected==='A'?parse(value).join(''):value,expected);
 const [criterion,order]=parse(value);
 return criterion===expected[0]&&(criterion==='0'?!order||order==='—':order===expected[1]);
}
function feedback(value,expected){
 const [criterion]=parse(value);
 return Array.isArray(expected)&&criterion===expected[0]&&criterion==='1'
  ?'Признак выбран верно. Сначала сопоставь вершины равных углов, затем концы соответствующих сторон.'
  :'Найди общую вершину двух данных сторон. Первый признак требует, чтобы данный угол был именно при ней.';
}
function triangle(a,b,c,color){
 return '<polygon points="'+[a,b,c].map(p=>p.join(',')).join(' ')+'" fill="'+color+'" fill-opacity=".14" stroke="'+color+'" stroke-width="2.5" />';
}
function label(p,name){
 return '<text x="'+p[0]+'" y="'+p[1]+'" font-size="20" fill="#183044">'+name+'</text>';
}
function figure(t){
 const angle=Math.PI/6;
 const scale=120/t.b, x=t.b*scale;
 const opposite=positions(t.a,'opposite',t.b);
 const shape=d=>{
  const c=t.between?[t.a*scale*Math.cos(angle),-t.a*scale*Math.sin(angle)]:[x-d*scale*Math.cos(angle),-d*scale*Math.sin(angle)];
  return [[0,0],[x,0],c];
 };
 const left=shape(opposite[0]).map(([x,y])=>[33+x,109+y]);
 const right=shape(opposite[1]).map(([x,y])=>[352-x*.64+y*.77,112-x*.77-y*.64]);
 const [p,q,r]=t.order;
 const labels=(points,names)=>points.map(([x,y],i)=>label([x+(i===1?7:-15),y+(i===2?-6:17)],names[i])).join('');
 return '<svg viewBox="0 0 415 135" width="100%" style="max-height:150px" role="img" aria-label="Два по-разному ориентированных треугольника. Данные записаны в условии.">'
  +triangle(...left,'#147c78')+triangle(...right,'#326ab3')
  +labels(left,['A','B','C'])+labels(right,[p,q,r])+'</svg>';
}
function positions(length,mode,b=6){
 const r=length, angle=Math.PI/6, direction={x:Math.cos(angle),y:Math.sin(angle)};
 if(mode==='included')return [length];
 const intersections=root.GeoMath.intersections(
  {type:'line',p:{x:0,y:0},q:direction},
  {type:'circle',o:{x:b,y:0},r});
 return intersections.filter(p=>p.x>0).map(p=>Math.hypot(p.x,p.y)).sort((a,b)=>a-b);
}
function experiment(el,observation,onChange){
 el.innerHTML='<section class="experiment"><h2>Угол между сторонами или напротив стороны?</h2><p>Дано AB = 6 и ∠A = 30°. В одном случае дана сторона AC = 4, в другом BC = 4. Предскажи, в каком случае возможны два разных треугольника.</p><form class="row" id="congruence-prediction"><label>Мой прогноз <select required><option value="">Выбери вариант</option><option value="included">При AC = 4</option><option value="opposite">При BC = 4</option><option value="neither">Ни в одном</option></select></label><button class="primary">Сверить на модели</button></form><div class="congruence-model" hidden><p class="feedback" role="status"></p><label>Какую сторону фиксируем? <select class="congruence-mode"><option value="included">AC = 4, угол между сторонами</option><option value="opposite">BC = 4, угол напротив стороны</option></select></label><svg viewBox="0 0 460 190" role="img" aria-label="Построение точки C по углу, стороне и окружности"></svg><p class="model-question" aria-live="polite"></p></div></section>';
 const form=el.querySelector('form'),prediction=form.querySelector('select'),model=el.querySelector('.congruence-model'),mode=el.querySelector('.congruence-mode'),svg=el.querySelector('svg'),out=el.querySelector('.model-question'),feedback=el.querySelector('.feedback');
 function draw(){
  const included=mode.value==='included', origin=[100,170], b=[244,170], scale=24;
  const point=t=>[origin[0]+t*scale*Math.cos(Math.PI/6),origin[1]-t*scale*Math.sin(Math.PI/6)];
  const end=point(12), circle=included?origin:b;
  const range=positions(4,mode.value);
  svg.innerHTML='<line x1="'+origin[0]+'" y1="'+origin[1]+'" x2="'+end[0]+'" y2="'+end[1]+'" stroke="#9cacc1" stroke-dasharray="5 5"/>'
   +'<circle cx="'+circle[0]+'" cy="'+circle[1]+'" r="'+(4*scale)+'" fill="none" stroke="#9cacc1" stroke-dasharray="5 5"/>'
   +range.map((d,i)=>{const c=point(d);return triangle(origin,b,c,['#147c78','#a76114'][i])+label([c[0]+5,c[1]-6],range.length===1?'C':['C₁','C₂'][i]);}).join('')
   +label([origin[0]-22,origin[1]+21],'A')+label([b[0]+5,b[1]+21],'B');
  out.textContent=included?'Точка C лежит на луче из A на расстоянии 4 от A. На луче одна такая точка.':'Точка C лежит на том же луче на расстоянии 4 от B. Окружность пересекает луч в двух точках. Длины AC₁ и AC₂ различаются.';
 }
 form.addEventListener('submit',e=>{
  e.preventDefault();if(!prediction.value)return;
  onChange(prediction.value);
  model.hidden=false;
  mode.value=prediction.value==='included'?'included':'opposite';
  feedback.textContent=prediction.value==='opposite'?'Прогноз верный. Сравни оба случая.':'Проверь оба случая. Посмотри, от какой вершины откладывают расстояние 4.';
  draw();
 });
 mode.addEventListener('change',draw);
 if(observation){prediction.value=observation;form.requestSubmit();}
}
// The standard journal retains events even when a different atlas unit is saved.
// Keep the latest pilot milestone in that same exportable format.
function progress(record){
 const marker=record?.events.findLast(e=>/^sas-v1:\d+:(included|opposite|neither)?$/.test(e.type));
 if(!marker)return null;
 const [,verified,prediction]=marker.type.split(':');
 return {verified:Number(verified),prediction};
}
function persist(state){
 const type='sas-v1:'+state.congruence.verified+':'+state.congruence.prediction;
 const time=Date.now();
 state.events=state.events.filter(e=>!e.type.startsWith('sas-v1:'));
 state.events.push({type,time});
}
root.GeoCongruence={task,check,feedback,figure,positions,experiment,progress,persist};
})(typeof window!=='undefined'?window:globalThis);
