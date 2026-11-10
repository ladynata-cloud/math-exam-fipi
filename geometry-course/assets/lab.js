(function(root){'use strict';const G=root.GeoMath;
const E=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function objectName(object){
 if(object.type==='circle')return 'Окружность с центром '+object.a+' через точку '+object.b;
 return ({segment:'Отрезок',ray:'Луч',line:'Прямая'}[object.extent]||'Линейный объект')+' '+object.a+object.b;
}
function initialScene(spec){
 const scene=JSON.parse(JSON.stringify(spec.scene||G.scene(spec.figure||'triangle')));
 if(!spec.scene&&spec.figure==='segment'&&['midpoint','perpbisector'].includes(spec.goal))scene.points=scene.points.filter(p=>p.id!=='C');
 if(!spec.scene&&spec.goal==='perpbisector'){
  Object.assign(scene.points.find(p=>p.id==='A'),{x:230,y:210});Object.assign(scene.points.find(p=>p.id==='B'),{x:410,y:210});
 }
 if(!spec.scene&&spec.figure==='angle'&&['perpendicular','parallel'].includes(spec.goal))scene.objects=[{id:'AB',type:'line',extent:'line',a:'A',b:'B'}];
 if(!spec.scene&&spec.goal==='reflection'){scene.points.find(p=>p.id==='A').y=230;scene.points.find(p=>p.id==='B').y=230;scene.points.find(p=>p.id==='C').y=105;}
 return scene;
}
function mount(el,spec,onChange){
 const board=new G.Board(initialScene(spec));let tool='move',selected=[],selectedPoint=board.points[0]?.id||'A',active=null,highlight=[],moved=false,view={x:0,y:0,k:1};
 const names={move:'Двигать',point:'Точка',segment:'Отрезок',line:'Прямая',circle:'Окружность',intersection:'Пересечение',midpoint:'Середина',perpendicular:'Перпендикуляр',parallel:'Параллельная',bisector:'Биссектриса',reflection:'Отражение'};
 const relevant={midpoint:['midpoint'],median:['midpoint','segment'],midline:['midpoint','segment'],altitude:['perpendicular'],perpendicular:['perpendicular'],parallel:['parallel'],bisector:['bisector'],reflection:['reflection'],diagonal:['segment'],perpbisector:['circle','intersection','line'],explore:[]}[spec.goal]||[];
 const button=t=>'<button data-tool="'+t+'">'+names[t]+'</button>';
 el.innerHTML='<div class="lab-mission" role="status"></div><div class="lab-controls"><div class="tools lab-primary">'+['move',...relevant].map(button).join('')+'</div><button data-act="undo" disabled>↶ Отменить последнее действие</button></div><p class="tool-instruction" aria-live="polite"></p><div class="canvas-wrap"><canvas tabindex="0" aria-label="Интерактивный чертёж. Стрелки двигают выбранную точку; Shift увеличивает шаг." width="640" height="420"></canvas></div><div class="lab-readout" aria-live="polite"></div><p class="lab-feedback" role="status"></p><div class="row"><button data-act="goal" class="primary">'+(spec.goal==='explore'?'Что записать в наблюдение?':'Проверить построение')+'</button><button data-act="fit">Показать весь чертёж</button><button data-act="reset">Начать чертёж заново</button></div><details class="extra-tools"><summary>Все инструменты и точный выбор</summary><div class="tools">'+Object.keys(names).filter(t=>t!=='move'&&!relevant.includes(t)).map(button).join('')+'</div><div class="keyboard-panel"><label>Точка <select class="point-select"></select></label><label>x <input class="point-x" type="number" min="25" max="615" step="5"></label><label>y <input class="point-y" type="number" min="30" max="385" step="5"></label><button data-act="move">Передвинуть точку</button><button data-act="select">Выбрать для построения</button></div></details><div class="object-panel" hidden><label>Объект <select class="object-select"></select></label><button data-act="object">Выбрать объект</button></div><details><summary>Как пользоваться чертежом</summary><p>Сначала выбери инструмент, затем нажимай точки по подсказке над рисунком. Можно нажать подпись точки. Синие точки двигаются мышью, пальцем и стрелками. Зелёные зависят от исходных. Отмена возвращает последний выбор, построение, перемещение или сброс; Ctrl+Z работает, когда чертёж в фокусе.</p><p>Перпендикуляр и параллельная: сначала точка, затем прямая или две её точки. Пересечения относятся к полным прямым и окружностям, даже если показаны отрезки. Измерения помогают наблюдать, но не заменяют доказательство.</p></details>';
 const cv=el.querySelector('canvas'),ctx=cv.getContext('2d'),dpr=Math.min(root.devicePixelRatio||1,2);cv.width=640*dpr;cv.height=420*dpr;ctx.scale(dpr,dpr);
 const readout=el.querySelector('.lab-readout'),feedback=el.querySelector('.lab-feedback');
 const need={move:1,point:0,segment:2,line:2,circle:2,intersection:2,midpoint:2,perpendicular:3,parallel:3,bisector:3,reflection:3};
 const instructions={move:'Потяни синюю точку мышью или пальцем.',point:'Нажми на свободное место, чтобы добавить точку.',segment:'Нажми первый конец отрезка.',line:'Нажми первую точку прямой.',circle:'Нажми центр окружности.',intersection:'Выбери первую линию или окружность на рисунке или в списке.',midpoint:'Нажми первый конец отрезка.',perpendicular:'Нажми точку, через которую провести перпендикуляр.',parallel:'Нажми точку, через которую провести параллельную.',bisector:'Нажми точку первого луча; затем вершину и точку второго луча.',reflection:'Нажми точку, которую нужно отразить.'};
 const movable=p=>p&&(!p.kind||p.kind==='free'||p.draggable)&&p.valid!==false;
 const same=(p,a,b)=>p.a===a&&p.b===b||p.a===b&&p.b===a;
 const midpoint=(a,b)=>board.points.find(p=>p.kind==='midpoint'&&same(p,a,b)&&p.valid!==false);
 function mission(){
  const m=midpoint('A','B'),ac=midpoint('A','C'),bc=midpoint('B','C');
  if(spec.goal!=='explore'&&board.goal(spec.goal||'explore').ok)return 'Построение готово. Выбери «Двигать», потяни синюю точку и запиши, что сохраняется.';
  const sequence={midpoint:'«Середина» → A → B. Появится зелёная середина AB.',median:m?'«Отрезок» → C → '+m.id+'. Соедини вершину с серединой AB.':'«Середина» → A → B. Сначала найдём середину стороны.',altitude:'«Перпендикуляр» → C → прямая AB (или точки A, B).',perpendicular:'«Перпендикуляр» → C → прямая AB (или точки A, B).',parallel:'«Параллельная» → C → прямая AB (или точки A, B).',bisector:'«Биссектриса» → A → C → B. Вершина C выбирается второй.',reflection:'«Отражение» → C → прямая AB (или точки A, B).',diagonal:'«Отрезок» → A → C. Соедини несоседние вершины.',midline:!ac?'«Середина» → A → C. Сначала середина AC.':!bc?'«Середина» → B → C. Теперь середина BC.':'«Отрезок» → '+ac.id+' → '+bc.id+'. Соедини две середины.',explore:'Выбери «Двигать» и потяни синюю точку. Сравни два положения; запиши, что изменилось и что осталось прежним.'};
  if(spec.goal==='perpbisector'){
   const ab=board.objects.find(o=>o.type==='circle'&&o.a==='A'&&o.b==='B'),ba=board.objects.find(o=>o.type==='circle'&&o.a==='B'&&o.b==='A');
   if(!ab)return '«Окружность» → A → B. Центр A, окружность проходит через B.';
   if(!ba)return '«Окружность» → B → A. Теперь такая же окружность с центром B.';
   const hits=board.points.filter(p=>p.kind==='intersection'&&[p.o1,p.o2].includes(ab.id)&&[p.o1,p.o2].includes(ba.id)&&p.valid!==false);
   return hits.length<2?'«Пересечение» → первая окружность → вторая окружность. Можно выбрать их в списке.':'«Прямая» → '+hits[0].id+' → '+hits[1].id+'. Соедини точки пересечения окружностей.';
  }
  return sequence[spec.goal]||sequence.explore;
 }
 function notify(type){if(onChange)onChange({type,board,moved});}
 function fail(msg){feedback.textContent=msg;feedback.className='lab-feedback error';}
 function options(){if(!board.point(selectedPoint))selectedPoint=board.points[0]?.id||'';el.querySelector('.point-select').innerHTML=board.points.map(p=>'<option value="'+E(p.id)+'">Точка '+E(p.id)+(movable(p)?' — подвижная':' — построенная')+'</option>').join('');el.querySelector('.point-select').value=selectedPoint;el.querySelector('.object-select').innerHTML=board.objects.map(o=>'<option value="'+E(o.id)+'">'+E(objectName(o))+'</option>').join('');syncFields();}
 function syncFields(){const p=board.point(selectedPoint);if(p){el.querySelector('.point-x').value=Math.round(p.x);el.querySelector('.point-y').value=Math.round(p.y);}}
 function instruction(){
  let next=instructions[tool];
  if(selected.length){
   if(tool==='intersection')next='Теперь выбери второй объект.';
   else if(['perpendicular','parallel','reflection'].includes(tool))next=selected.length===1?'Теперь нажми исходную прямую или первую из двух её точек.':'Теперь нажми вторую точку исходной прямой.';
   else if(tool==='bisector')next=selected.length===1?'Теперь нажми вершину угла.':'Теперь нажми точку второго луча.';
   else next=tool==='circle'?'Теперь нажми точку, через которую проходит окружность.':'Теперь нажми вторую точку.';
  }
  const chosen=selected.map(id=>tool==='intersection'&&board.object(id)?objectName(board.object(id)):'Точка '+id);
  el.querySelector('.tool-instruction').textContent=next+(chosen.length?' Выбрано: '+chosen.join(', ')+'.':'');
  el.querySelector('.lab-mission').textContent=mission();el.querySelector('.object-panel').hidden=tool!=='intersection';
  el.querySelector('[data-act=undo]').disabled=!selected.length&&!board.history.length;
  el.querySelectorAll('[data-tool]').forEach(b=>{b.classList.toggle('on',b.dataset.tool===tool);b.setAttribute('aria-pressed',String(b.dataset.tool===tool));});
 }
 function pick(id){
  const duplicate=selected.includes(id),canRepeat=['perpendicular','parallel','reflection'].includes(tool)&&(selected.length===1||selected.length===2&&id===selected[0]&&id!==selected[1]);
  if(duplicate&&!canRepeat){fail('Эта точка или объект уже выбраны. Выбери другой или нажми «Отменить последнее действие».');return;}
  selected.push(id);instruction();if(selected.length<need[tool]){draw();return;}
  try{board.make(tool,selected);moved=true;selected=[];options();fit();draw();feedback.className='lab-feedback';feedback.textContent=board.goal(spec.goal||'explore').ok?'Построение готово. Теперь передвинь исходную точку и сравни измерения.':'Объект построен. Следующий шаг указан над рисунком.';notify('construction');}
  catch(e){selected.pop();fail(e.message);}
  instruction();draw();
 }
 function undo(){active=null;if(selected.length){selected.pop();feedback.textContent='Последний выбор отменён.';}else if(board.undo()){moved=true;feedback.textContent='Последнее действие отменено.';notify('undo');}feedback.className='lab-feedback';options();fit();instruction();draw();}
 function fit(){board.update();const ps=board.points.filter(p=>p.valid!==false);const minX=Math.min(0,...ps.map(p=>p.x-35)),maxX=Math.max(640,...ps.map(p=>p.x+35)),minY=Math.min(0,...ps.map(p=>p.y-35)),maxY=Math.max(420,...ps.map(p=>p.y+35));const k=Math.min(640/(maxX-minX),420/(maxY-minY));view={k,x:(640-(maxX-minX)*k)/2-minX*k,y:(420-(maxY-minY)*k)/2-minY*k};}
 function screen(e){const r=cv.getBoundingClientRect();return {x:((e.clientX-r.left)*640/r.width-view.x)/view.k,y:((e.clientY-r.top)*420/r.height-view.y)/view.k};}
 function nearest(q){const tol=22*640/cv.getBoundingClientRect().width/view.k;return board.points.filter(p=>p.valid!==false).map(p=>({p,d:Math.min(G.dist(p,q),G.dist({x:p.x+16,y:p.y-16},q))})).sort((a,b)=>a.d-b.d).find(v=>v.d<tol)?.p;}
 function hit(q,linesOnly=false){const tol=12*640/cv.getBoundingClientRect().width/view.k;let result=null,best=tol;board.objects.forEach(o=>{const g=board.geometry(o);if(!g||linesOnly&&g.type!=='line')return;let d;if(g.type==='circle')d=Math.abs(G.dist(q,g.o)-g.r);else{const h=G.foot(q,g.p,g.q);d=h?G.dist(h,q):Infinity;}if(d<best){best=d;result=o;}});return result;}
 function move(id,q){if(board.move(id,q.x,q.y)){moved=true;draw();syncFields();instruction();feedback.textContent='';notify('move');}}
 cv.addEventListener('pointerdown',e=>{e.preventDefault();cv.focus({preventScroll:true});const q=screen(e),p=nearest(q);
  if(tool==='point'){try{board.addPoint(q.x,q.y);moved=true;options();draw();instruction();notify('construction');}catch(e){fail(e.message);}return;}
  if(tool==='intersection'){const o=hit(q);if(o)pick(o.id);else fail('Нажми на окружность или линию либо выбери её в списке.');return;}
  if(!p&&['perpendicular','parallel','reflection'].includes(tool)&&selected.length===1){const o=hit(q,true);if(o){pick(o.a);pick(o.b);return;}}
  if(!p){fail(selected.length?'Нажми следующую отмеченную точку; порядок указан над рисунком.':'Сначала нажми отмеченную точку. Можно нажать её букву.');return;}
  selectedPoint=p.id;el.querySelector('.point-select').value=p.id;syncFields();
  if(tool==='move'){if(!movable(p)){fail('Зелёная точка построена. Двигай синие исходные точки.');return;}active={id:p.id,dx:p.x-q.x,dy:p.y-q.y,start:board.snapshot(),remembered:false};try{cv.setPointerCapture(e.pointerId);}catch(_){} }
  else pick(p.id);draw();
 });
 cv.addEventListener('pointermove',e=>{if(active){const q=screen(e),p=board.point(active.id);q.x+=active.dx;q.y+=active.dy;if(G.dist(q,p)<.5)return;if(!active.remembered){board.remember();active.remembered=true;}move(active.id,q);}});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])cv.addEventListener(event,()=>{active=null;});
 cv.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();undo();return;}if(e.key==='Escape'){selected=[];instruction();draw();return;}const d={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(!d)return;e.preventDefault();const p=board.point(selectedPoint);if(!movable(p)){fail('Выбери синюю подвижную точку.');return;}board.remember();move(p.id,{x:p.x+d[0]*(e.shiftKey?10:2),y:p.y+d[1]*(e.shiftKey?10:2)});});
 el.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.tool){tool=b.dataset.tool;selected=[];feedback.textContent='';instruction();draw();return;}const act=b.dataset.act;
  if(act==='select'&&tool!=='move'&&tool!=='point')pick(el.querySelector('.point-select').value);
  if(act==='object'&&tool==='intersection')pick(el.querySelector('.object-select').value);
  if(act==='undo')undo();
  if(act==='fit'){fit();draw();}
  if(act==='reset'){board.reset(true);selected=[];moved=false;options();fit();draw();instruction();feedback.textContent='Исходный чертёж восстановлен. Это действие тоже можно отменить.';notify('reset');}
  if(act==='move'){const xField=el.querySelector('.point-x'),yField=el.querySelector('.point-y');if(!xField.value.trim()||!yField.value.trim())return fail('Заполни обе координаты. Пустое поле не равно нулю.');const x=Number(xField.value),y=Number(yField.value);if(!Number.isFinite(x+y))return fail('Введите конечные координаты.');if(tool==='point'){try{board.addPoint(x,y);moved=true;options();draw();instruction();notify('construction');}catch(e){fail(e.message);}}else{if(!movable(board.point(selectedPoint)))return fail('Выбери подвижную исходную точку.');board.remember();move(selectedPoint,{x,y});}}
  if(act==='goal'){const result=board.goal(spec.goal||'explore');feedback.textContent=result.ok?'Построение выполнено. Передвинь исходную точку, сравни измерения и запиши наблюдение.':spec.goal==='explore'?'Сравни два положения фигуры. Запиши одно изменение и одну сохранившуюся связь. Это наблюдение, а не доказательство.':result.message+' Следующий шаг указан над рисунком.';feedback.className='lab-feedback '+(result.ok?'good':'');notify(result.ok?'goal':'goal-attempt');}
 });
 el.querySelector('.point-select').addEventListener('change',e=>{selectedPoint=e.target.value;syncFields();draw();});
 function text(p,t){ctx.font='600 16px system-ui';ctx.lineWidth=5;ctx.strokeStyle='#fffdf7';ctx.strokeText(t,p.x,p.y);ctx.fillStyle='#17233c';ctx.fillText(t,p.x,p.y);}
 function draw(){board.update();ctx.clearRect(0,0,640,420);ctx.save();ctx.translate(view.x,view.y);ctx.scale(view.k,view.k);ctx.fillStyle='#fffdf7';ctx.fillRect(0,0,640,420);ctx.fillStyle='#e3e4df';for(let x=15;x<640;x+=25)for(let y=15;y<420;y+=25){ctx.beginPath();ctx.arc(x,y,1,0,7);ctx.fill();}
  ctx.save();ctx.beginPath();ctx.rect(-view.x/view.k,-view.y/view.k,640/view.k,420/view.k);ctx.clip();
  const poly=['A','B','C','D'].map(id=>board.point(id)).filter(Boolean);if(poly.length>=3&&spec.figure!=='angle'&&spec.figure!=='segment'){ctx.beginPath();poly.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle='#2d70b317';ctx.fill();}
  for(const o of board.objects){const g=board.geometry(o);if(!g)continue;ctx.strokeStyle=highlight.includes(o.a+o.b)||highlight.includes(o.b+o.a)?'#ca6224':o.added?'#118469':'#294564';ctx.lineWidth=highlight.includes(o.a+o.b)?5:o.added?2.6:2.3;ctx.setLineDash(o.added?[7,4]:[]);ctx.beginPath();if(g.type==='circle')ctx.arc(g.o.x,g.o.y,g.r,0,Math.PI*2);else{let p=g.p,q=g.q;if(o.extent!=='segment'){const u=G.unit(G.sub(q,p));q=G.add(p,G.mul(u,1800));if(o.extent==='line')p=G.add(p,G.mul(u,-1800));}ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);}ctx.stroke();}
  ctx.setLineDash([]);
  const a=board.point('A'),b=board.point('B'),c=board.point('C');let report=[];
  if(a&&b){report.push('AB = '+(G.dist(a,b)/50).toFixed(2));}
  if(a&&b&&c&&spec.figure!=='segment'&&!['perpendicular','parallel','reflection'].includes(spec.goal)){const ang=G.angle(a,c,b);report.push('∠ACB = '+(ang===null?'не определён':ang.toFixed(1)+'°'));report.push('S△ABC = '+(Math.abs(G.cross(G.sub(b,a),G.sub(c,a)))/5000).toFixed(2));if(ang!==null){let s=Math.atan2(a.y-c.y,a.x-c.x),t=Math.atan2(b.y-c.y,b.x-c.x),delta=(t-s+Math.PI*3)%(Math.PI*2)-Math.PI;ctx.strokeStyle='#bd6b27';ctx.lineWidth=2;ctx.beginPath();ctx.arc(c.x,c.y,Math.min(29,G.dist(a,c)/3,G.dist(b,c)/3),s,s+delta,delta<0);ctx.stroke();}}
  ctx.restore();
  if(a&&b){const m=midpoint('A','B');if(m)report.push('A'+m.id+' = '+(G.dist(a,m)/50).toFixed(2),' '+m.id+'B = '+(G.dist(m,b)/50).toFixed(2));}
  if(['perpendicular','altitude'].includes(spec.goal)&&a&&b&&c){const o=board.objects.find(o=>{const p=board.point(o.b);return o.construction==='perpendicular'&&o.a==='C'&&p&&((p.b==='A'&&p.c==='B')||(p.b==='B'&&p.c==='A'));}),g=o&&board.geometry(o);if(g){const v=G.sub(g.q,g.p),base=G.sub(b,a);const deg=Math.acos(Math.max(-1,Math.min(1,G.dot(v,base)/(G.norm(v)*G.norm(base)))))*180/Math.PI;report.push('Угол с AB = '+deg.toFixed(1)+'°');const h=G.foot(c,a,b);if(h){ctx.beginPath();const u=G.unit(base),w=G.unit(v);[G.add(h,G.mul(u,12)),G.add(G.add(h,G.mul(u,12)),G.mul(w,12)),G.add(h,G.mul(w,12))].forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle='#118469';ctx.stroke();}}}
  if(spec.goal==='bisector'&&a&&b&&c){const p=board.points.find(p=>p.kind==='bisector'&&p.b==='C'&&p.valid!==false);if(p){const left=G.angle(a,c,p),right=G.angle(p,c,b);if(left!==null&&right!==null)report.push('∠AC'+p.id+' = '+left.toFixed(1)+'°','∠'+p.id+'CB = '+right.toFixed(1)+'°');}}
  for(const p of board.points){if(p.valid===false)continue;if(selected.includes(p.id)){ctx.beginPath();ctx.arc(p.x,p.y,12,0,7);ctx.strokeStyle='#c06c2a';ctx.lineWidth=3;ctx.stroke();}ctx.beginPath();ctx.arc(p.x,p.y,selectedPoint===p.id?7:5,0,7);ctx.fillStyle=movable(p)?'#2d70b3':'#118469';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#fff';ctx.stroke();text({x:p.x+10,y:p.y-10},p.id);}
  ctx.restore();
  readout.textContent=report.join(' · ')+(board.points.some(p=>p.valid===false)?' · Некоторые построения сейчас не существуют.':'');
 }
 options();instruction();draw();return {board,highlight(ids){highlight=ids||[];draw();},redraw(){options();fit();instruction();draw();},destroy(){active=null;}};
}
root.GeoLab={mount};})(window);
