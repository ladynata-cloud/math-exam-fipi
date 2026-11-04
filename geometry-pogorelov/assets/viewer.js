(function(root){'use strict';const S=Space,E=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const {add,sub,mul,dot}=S;
// BEGIN GENERATED VISIBILITY FALLBACK
  function visibilityParts(a, b, surfaces, tolerance) {
    const delta = sub(b, a), cross2 = (u, v) => u[0] * v[1] - u[1] * v[0];
    const parameterTolerance = Math.min(1e-7, tolerance / Math.max(Math.hypot(...delta), tolerance));
    const at = t => add(a, mul(delta, t));
    const hidden = [];
    for (const face of surfaces) {
      if (face.sphere) {
        const { center, radius } = face.sphere, offset = sub(a, center), cuts = [0, 1];
        const roots = (A, B, C) => {
          if (Math.abs(A) < 1e-20) { if (Math.abs(B) > 1e-20) cuts.push(-C / B); return; }
          let discriminant = B * B - 4 * A * C;
          if (Math.abs(discriminant) <= 1e-12 * (B * B + Math.abs(4 * A * C))) discriminant = 0;
          if (discriminant >= 0) { const d = Math.sqrt(discriminant); cuts.push((-B - d) / (2 * A), (-B + d) / (2 * A)); }
        };
        if (face.surface) {
          // Great circles are stored as short chords. Only the explicitly
          // reviewed ring strokes represent arcs on this sphere's surface.
          if (Math.abs(delta[2]) > tolerance) cuts.push(-offset[2] / delta[2]);
        } else {
          roots(delta[0] ** 2 + delta[1] ** 2, 2 * (offset[0] * delta[0] + offset[1] * delta[1]), offset[0] ** 2 + offset[1] ** 2 - radius ** 2);
          roots(dot(delta, delta), 2 * dot(offset, delta), dot(offset, offset) - radius ** 2);
        }
        const sorted = cuts.filter(t => t >= 0 && t <= 1).sort((x, y) => x - y);
        for (let i = 1; i < sorted.length; i++) {
          const start = sorted[i - 1], end = sorted[i];
          if (end - start < 1e-10) continue;
          const p = sub(at((start + end) / 2), center), radial2 = p[0] ** 2 + p[1] ** 2;
          const covered = face.surface ? p[2] < -tolerance
            : radial2 < radius ** 2 * (1 - 1e-12) && Math.sqrt(Math.max(0, radius ** 2 - radial2)) > p[2] + tolerance;
          if (covered) hidden.push([start, end]);
        }
        continue;
      }
      const { vertices, normal } = face;
      if (Math.abs(normal[2]) < 1e-10) continue; // An edge-on face covers no area.
      const depthDifference = p => dot(normal, sub(vertices[0], p)) / normal[2];
      const da = depthDifference(a), db = depthDifference(b);
      if (Math.max(da, db) <= tolerance) continue; // On or in front of this face.
      const cuts = [0, 1];
      if ((da - tolerance) * (db - tolerance) < 0) cuts.push((tolerance - da) / (db - da));
      const length2 = delta[0] ** 2 + delta[1] ** 2;
      for (let i = 0; i < vertices.length; i++) {
        const p = vertices[i], q = vertices[(i + 1) % vertices.length];
        const edge = sub(q, p), offset = sub(p, a), denominator = cross2(delta, edge);
        const scale = Math.sqrt(length2 * (edge[0] ** 2 + edge[1] ** 2));
        if (Math.abs(denominator) > scale * 1e-12) {
          const t = cross2(offset, edge) / denominator, u = cross2(offset, delta) / denominator;
          if (t > 0 && t < 1 && u >= -1e-10 && u <= 1 + 1e-10) cuts.push(t);
        } else if (length2 > tolerance ** 2 && Math.abs(cross2(offset, delta)) <= tolerance * Math.sqrt(length2)) {
          for (const v of [p, q]) {
            const t = ((v[0] - a[0]) * delta[0] + (v[1] - a[1]) * delta[1]) / length2;
            if (t > 0 && t < 1) cuts.push(t);
          }
        }
      }
      function inside(p) {
        let enclosed = false;
        for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
          const v = vertices[j], w = vertices[i], e = sub(w, v), relative = sub(p, v);
          const len = Math.hypot(e[0], e[1]);
          if (len > tolerance && Math.abs(cross2(e, relative)) <= tolerance * len
              && relative[0] * e[0] + relative[1] * e[1] >= -tolerance * len
              && relative[0] * e[0] + relative[1] * e[1] <= len * len + tolerance * len) return true;
          if ((v[1] > p[1]) !== (w[1] > p[1])
              && p[0] < (w[0] - v[0]) * (p[1] - v[1]) / (w[1] - v[1]) + v[0]) enclosed = !enclosed;
        }
        return enclosed;
      }
      cuts.sort((x, y) => x - y);
      for (let i = 1; i < cuts.length; i++) {
        const start = cuts[i - 1], end = cuts[i];
        if (end - start < 1e-10) continue;
        const p = at((start + end) / 2);
        if (depthDifference(p) > tolerance && inside(p)) hidden.push([start, end]);
      }
    }
    hidden.sort((x, y) => x[0] - y[0]);
    const merged = [];
    for (const interval of hidden) {
      // Coordinate rounding must not create a zero-pixel phantom dash at a
      // vertex. Discard only intervals below the same world-space tolerance
      // used for depth, and keep an exact partition of the remaining line.
      if (interval[1] - interval[0] <= parameterTolerance) continue;
      if (interval[0] < parameterTolerance) interval[0] = 0;
      if (interval[1] > 1 - parameterTolerance) interval[1] = 1;
      const last = merged[merged.length - 1];
      if (last && interval[0] <= last[1] + parameterTolerance) last[1] = Math.max(last[1], interval[1]);
      else merged.push(interval.slice());
    }
    const result = [];
    let start = 0;
    for (const [from, to] of merged) {
      if (from > start + 1e-10) result.push({ start, end: from, hidden: false });
      result.push({ start: from, end: to, hidden: true });
      start = to;
    }
    if (start < 1 - 1e-10) result.push({ start, end: 1, hidden: false });
    return result;
  }

// END GENERATED VISIBILITY FALLBACK
function mount(el,options={},onChange=()=>{}){
 const state={kind:options.kind||'box',a:4,b:3,h:4,yaw:.65,pitch:.48,zoom:62,level:.5,tilt:0,turn:0,opacity:.2,planeMode:'slider',planeIds:[],points:[],lines:[],showSection:false,showPlane:true,manual:options.mode==='section',selected:'',history:[]};if(options.saved&&options.saved.kind===state.kind)Object.assign(state,options.saved);let model,coords={},pl,cut=[],projected={},active=null;const pointLetters='MNPQRTUVWXYZ';
 el.innerHTML='<div class="space-head"><span class="pill">Объёмная модель</span><span class="space-tip">Вращай свободное поле · точки на рёбрах можно тянуть</span></div><div class="space-canvas"><button class="exit-model" data-action="exit-fullscreen">Вернуться к уроку</button><canvas tabindex="0" aria-label="Пространственная модель. Стрелки вращают, плюс и минус изменяют масштаб."></canvas></div><div class="space-metrics" aria-live="polite"></div><div class="camera-actions"><button data-action="fullscreen">Развернуть модель</button><button data-action="front">Спереди</button><button data-action="top">Сверху</button><button data-action="orbit">Объёмный вид</button><label>Масштаб <input data-param="zoom" type="range" min="30" max="100" step="1" value="62"></label><label>Прозрачность граней <input data-param="opacity" type="range" min=".05" max=".8" step=".05" value=".2"></label></div><details open><summary>Изменить тело и секущую плоскость</summary><div class="space-controls"><label>Размер a <input data-param="a" type="range" min="1" max="6" step=".1" value="4"></label><label>Размер b <input data-param="b" type="range" min=".5" max="6" step=".1" value="3"></label><label>Высота h <input data-param="h" type="range" min="1" max="6" step=".1" value="4"></label><label>Уровень плоскости <input data-param="level" type="range" min="-.2" max="1.2" step=".01" value=".5"></label><label>Наклон плоскости <input data-param="tilt" type="range" min="0" max="90" step="1" value="0"></label><label>Поворот плоскости <input data-param="turn" type="range" min="0" max="360" step="1" value="0"></label></div><p class="dimension-note"></p><div class="row"><button data-action="plane">Скрыть / показать плоскость</button><button data-action="section">Показать / скрыть контур сечения</button></div></details><details class="construction-panel" open><summary>Сделать своё построение</summary><p>Выбери ребро и создай зависимую точку. Её можно двигать по ребру мышью, пальцем или ползунком. Три точки зададут секущую плоскость.</p><div class="space-controls"><label>Ребро <select class="edge-select"></select></label><label>Доля ребра t <input class="edge-t" type="range" min="0" max="1" step=".01" value=".5"></label><button data-action="point">Добавить точку</button></div><div class="space-controls point-picks">'+[1,2,3,4].map(i=>'<label>Точка '+i+'<select class="pick" data-pick="'+i+'"></select></label>').join('')+'</div><div class="row"><button data-action="line">Отрезок 1–2</button><button data-action="three-plane">Плоскость 1–2–3</button><button data-action="foot">Перпендикуляр из 1 к плоскости</button><button data-action="measure">Измерить углы и расстояние</button></div><p class="measurement" role="status"></p><label>Двигать созданную точку <select class="move-point"></select><input class="move-t" type="range" min="0" max="1" step=".01" value=".5"></label><div class="row"><button data-action="check">Проверить построенный контур сечения</button><button data-action="undo">Отменить построение</button><button data-action="clear">Очистить построения</button></div></details><p class="space-feedback" role="status"></p><details><summary>Что именно показывает модель</summary><p>Вершины, плоскости и пересечения вычисляются в трёхмерных координатах. Вращение меняет только ракурс. Проекция параллельная: длины и углы на экране обычно искажены. Для вычислений используй подписи, условия задачи и геометрические связи.</p><p>На цилиндре, конусе и сфере сетка поверхности служит визуализации. Контур сечения цилиндра и конуса приближён сеткой; измерения площади такого контура помечены как приближённые. Круг сечения сферы вычисляется аналитически.</p></details>';
 const cv=el.querySelector('canvas'),ctx=cv.getContext('2d'),feedback=el.querySelector('.space-feedback');let width=800,height=500,dpr=Math.min(devicePixelRatio||1,2),measurementIds=null;cv.width=width*dpr;cv.height=height*dpr;ctx.scale(dpr,dpr);
 function snap(){state.history.push(JSON.stringify({points:state.points,lines:state.lines,planeMode:state.planeMode,planeIds:state.planeIds}));if(state.history.length>50)state.history.shift();}
 function say(s,error=false){feedback.textContent=s;feedback.className='space-feedback '+(error?'error':'good');}
 function emit(type){onChange({type,state:{kind:state.kind,a:state.a,b:state.b,h:state.h,points:state.points,lines:state.lines,planeMode:state.planeMode,planeIds:state.planeIds,level:state.level,tilt:state.tilt,turn:state.turn},section:cut});}
 function rebuild(){model=S.solid(state.kind,state.a,state.b,state.h);coords={};model.vertices.forEach((p,i)=>{if(model.names[i])coords[model.names[i]]=p;});for(const p of state.points){if(p.kind==='edge'){const edge=model.edges[p.edge];if(edge)coords[p.id]=S.lerp(model.vertices[edge[0]],model.vertices[edge[1]],p.t);}}
 const tt=state.tilt*Math.PI/180,phi=state.turn*Math.PI/180,n=[Math.sin(tt)*Math.cos(phi),Math.sin(tt)*Math.sin(phi),Math.cos(tt)];const top=state.kind==='sphere'?state.a:state.h;pl=state.planeMode==='points'?(state.planeIds.length===3&&state.planeIds.every(id=>coords[id])?S.plane(...state.planeIds.map(id=>coords[id])):null):{n,d:S.dot(n,[0,0,top/2])+(state.level-.5)*top};
 if(pl){for(const p of state.points)if(p.kind==='foot'&&coords[p.source])coords[p.id]=S.foot(coords[p.source],pl);cut=model.sphere?S.sphereSection(model.sphere,pl):S.section(model,pl);}else cut=[];
 cut.forEach((p,i)=>{if(!model.curved)coords['X'+(i+1)]=p;});
 el.querySelector('.construction-panel').hidden=!!model.curved;
 el.querySelector('.dimension-note').textContent=state.kind==='box'?`a=${state.a.toFixed(1)}, b=${state.b.toFixed(1)}, h=${state.h.toFixed(1)} — три ребра.`:state.kind==='pyramid'?`a=${state.a.toFixed(1)} — сторона квадратного основания, h=${state.h.toFixed(1)} — высота. b здесь не используется.`:state.kind==='sphere'?`a=${state.a.toFixed(1)} — диаметр сферы. b и h здесь не используются.`:state.kind==='frustum'||state.kind==='cone-frustum'?`a=${state.a.toFixed(1)}, b=${state.b.toFixed(1)} — диаметры описанных окружностей оснований; h=${state.h.toFixed(1)}.`:`a=${state.a.toFixed(1)} — диаметр окружности основания, h=${state.h.toFixed(1)} — высота. b здесь не используется.`;
 }
 function proj(p){const z=p[2]-(state.kind==='sphere'?state.a:state.h)/2,c=Math.cos(state.yaw),s=Math.sin(state.yaw),x=p[0]*c-p[1]*s,y=p[0]*s+p[1]*c;return {x:width/2+x*state.zoom,y:height/2+(y*Math.sin(state.pitch)-z*Math.cos(state.pitch))*state.zoom,d:y*Math.cos(state.pitch)+z*Math.sin(state.pitch)};}
 const classify=root.TaskSceneViewer?.visibilityParts||visibilityParts;
 let surfaces=[],strokes=[],visibilityTolerance=1e-8;
 function camera(p){const q=proj(p);return [(q.x-width/2)/state.zoom,(height/2-q.y)/state.zoom,q.d];}
 function polygon(ps,fill,stroke,sphereArc=false){if(ps.length<3)return;ctx.beginPath();ps.forEach((p,i)=>{const q=proj(p);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke)for(let i=0;i<ps.length;i++)segment(ps[i],ps[(i+1)%ps.length],stroke,1.7,sphereArc);}
 function segment(a,b,color,w=2,sphereArc=false){
  if(!a||!b)return;
  // Only the analytically computed section-circle strokes represent sphere
  // arcs. A chord or arbitrary construction with surface endpoints is interior.
  const occluders=sphereArc&&model.sphere?surfaces.map(face=>({...face,surface:true})):surfaces;
  for(const part of classify(camera(a),camera(b),occluders,visibilityTolerance)){
   const p=proj(S.lerp(a,b,part.start)),q=proj(S.lerp(a,b,part.end));
   strokes.push({p,q,color,w,hidden:part.hidden});
  }
 }
 function paintStrokes(){
  // Visible boundaries remain on top; coincident reversed/subdivided hidden
  // lines use a common screen-space phase instead of filling one another's gaps.
  strokes.sort((a,b)=>Number(b.hidden)-Number(a.hidden));
  for(const {p,q,color,w,hidden}of strokes){
   ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.strokeStyle=color;ctx.lineWidth=w;
   ctx.setLineDash(hidden?[5,5]:[]);ctx.lineDashOffset=0;
   if(hidden){const dx=q.x-p.x,dy=q.y-p.y,length=Math.hypot(dx,dy);if(length>1e-8){const direction=Math.abs(dx)>length*1e-10?Math.sign(dx):Math.sign(dy),along=(p.x*dx+p.y*dy)/length*direction;ctx.lineDashOffset=(direction>0?along:5-along)%10;}}
   ctx.stroke();
  }
  ctx.setLineDash([]);ctx.lineDashOffset=0;
 }
 function draw(){rebuild();strokes=[];visibilityTolerance=Math.max(state.a,state.b,state.h)*1e-8;
  surfaces=model.sphere?[{sphere:{center:camera(model.sphere.center),radius:model.sphere.r}}]:model.faces.map(f=>{const vertices=f.map(i=>camera(model.vertices[i])),normal=S.unit(S.cross(S.sub(vertices[1],vertices[0]),S.sub(vertices[2],vertices[0])))||[0,0,0];return {vertices,normal};});
  ctx.clearRect(0,0,width,height);ctx.fillStyle='#f7faf8';ctx.fillRect(0,0,width,height);for(let i=-5;i<=5;i++){segment([i,-5,0],[i,5,0],'#dde7e1',.8);segment([-5,i,0],[5,i,0],'#dde7e1',.8);}const fs=model.faces.map(f=>({f,depth:f.reduce((s,i)=>s+proj(model.vertices[i]).d,0)/f.length})).sort((a,b)=>a.depth-b.depth);
 for(const {f}of fs)polygon(f.map(i=>model.vertices[i]),`rgba(24,112,136,${state.opacity})`,null);
 if(pl&&state.showPlane){const [u,v]=S.basis(pl.n),o=S.foot([0,0,state.h/2],pl),r=Math.max(state.a,state.b,state.h)*.8;polygon([[1,1],[-1,1],[-1,-1],[1,-1]].map(([a,b])=>S.add(o,S.add(S.mul(u,r*a),S.mul(v,r*b)))),'#f0b05e25','#d29a5355');}
 if(!model.curved){for(const [i,j] of model.edges)segment(model.vertices[i],model.vertices[j],'#2a587b',1.7);}else if(state.kind!=='sphere'){for(let i=0;i<model.edges.length;i+=3){const [a,b]=model.edges[i];segment(model.vertices[a],model.vertices[b],'#537b8955',.8);}}
 if(cut.length>=3&&state.showSection)polygon(cut,'#e3a24950','#bc7020',!!model.sphere);
 for(const l of state.lines)segment(coords[l.a],coords[l.b],'#a851ba',3);
 paintStrokes();
 projected={};const groups=[];for(const [id,p]of Object.entries(coords)){const q=proj(p);projected[id]=q;const isCut=id.startsWith('X'),added=state.points.some(x=>x.id===id);if(isCut&&!state.manual&&!state.showSection)continue;const same=groups.find(g=>S.dist(g.p,p)<1e-7);if(same){same.ids.push(id);same.added=same.added||added;same.isCut=same.isCut||isCut;}else groups.push({p,q,ids:[id],added,isCut});}
 const boxes=[];for(const g of groups){const {q,added,isCut}=g;ctx.beginPath();ctx.arc(q.x,q.y,added?7:4,0,Math.PI*2);ctx.fillStyle=added?'#148a6a':isCut?'#c16d21':'#1d4c6d';ctx.fill();ctx.font=(added?'bold ':'')+'15px system-ui';const label=g.ids.join(' = '),w=ctx.measureText(label).width;let x=Math.min(width-w-6,Math.max(6,q.x+9)),y=Math.max(20,q.y-8);for(let n=0;n<12&&boxes.some(b=>x<b.x+b.w+4&&x+w+4>b.x&&y-17<b.y+4&&y+4>b.y-17);n++)y+=21;boxes.push({x,y,w});if(Math.abs(y-(q.y-8))>5){ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.lineTo(x,y-7);ctx.strokeStyle='#81939a';ctx.lineWidth=1;ctx.stroke();}ctx.lineWidth=4;ctx.strokeStyle='#f7faf8';ctx.strokeText(label,x,y);ctx.fillStyle='#17334b';ctx.fillText(label,x,y);}
 const m=S.metrics(state.kind,state.a,state.b,state.h);let info=[];if(m.volume!==undefined)info.push('V = '+m.volume.toFixed(3));if(m.surface!==undefined)info.push('S поверхности = '+m.surface.toFixed(3));if(!pl)info.push('Плоскость не определена: точки совпали или лежат на одной прямой');else if(cut.length===0)info.push('Плоскость не пересекает тело');else if(cut.length<3)info.push('Вырожденное сечение: точка или отрезок');else{if(model.sphere){const d=S.dist(model.sphere.center,S.foot(model.sphere.center,pl)),r=Math.sqrt(Math.max(0,model.sphere.r**2-d*d));info.push('Радиус сечения = '+r.toFixed(3),'S сечения = '+(Math.PI*r*r).toFixed(3));}else info.push((model.curved?'S сечения ≈ ':'S сечения = ')+S.area(cut).toFixed(3));if(!model.curved)info.push('Вершин сечения: '+cut.length);}
 el.querySelector('.space-metrics').textContent=info.join(' · ');
 updateMeasurement();
 }
 function updateMeasurement(){if(!measurementIds)return;const output=el.querySelector('.measurement'),ps=measurementIds;if(!pl||ps.some(id=>!coords[id])){output.textContent='Измерение сейчас не определено: проверь плоскость и выбранные точки.';return;}const p=coords[ps[0]],v=S.sub(coords[ps[1]],p),w=S.sub(coords[ps[3]],coords[ps[2]]),angle=S.linePlaneAngle(v,pl),angle2=S.angle(v,w);output.textContent='Расстояние '+ps[0]+' до плоскости: '+S.dist(p,S.foot(p,pl)).toFixed(3)+'; угол '+ps[0]+ps[1]+' с плоскостью: '+(angle===null?'не определён':angle.toFixed(2)+'°')+'; угол прямых '+ps[0]+ps[1]+' и '+ps[2]+ps[3]+': '+(angle2===null?'не определён':angle2.toFixed(2)+'°')+'.';}
 function fillSelects(){const ids=Object.keys(coords);el.querySelectorAll('.pick').forEach((sel,i)=>{const v=sel.value;sel.innerHTML=ids.map(id=>'<option>'+E(id)+'</option>').join('');sel.value=ids.includes(v)?v:ids[i%ids.length]||'';});const es=el.querySelector('.edge-select'),old=es.value;es.innerHTML=model.curved?'':model.edges.map(([a,b],i)=>'<option value="'+i+'">'+E(model.names[a]+'–'+model.names[b])+'</option>').join('');if(old)es.value=old;const mp=el.querySelector('.move-point'),prev=mp.value;mp.innerHTML=state.points.filter(p=>p.kind==='edge').map(p=>'<option>'+p.id+'</option>').join('');if(state.points.some(p=>p.id===prev))mp.value=prev;}
 function refresh(){draw();fillSelects();}
 function id(){for(const c of pointLetters)if(!coords[c])return c;return 'P'+state.points.length;}
 function picks(){return [...el.querySelectorAll('.pick')].map(s=>s.value);}
 el.addEventListener('input',e=>{if(e.target.dataset.param){const k=e.target.dataset.param;state[k]=+e.target.value;if(['level','tilt','turn'].includes(k))state.planeMode='slider';refresh();if(!['zoom','opacity'].includes(k))emit('change');}if(e.target.classList.contains('move-t')){const p=state.points.find(p=>p.id===el.querySelector('.move-point').value);if(p){p.t=+e.target.value;refresh();emit('move-point');}}});
 el.querySelector('.move-point').addEventListener('change',e=>{const p=state.points.find(p=>p.id===e.target.value);if(p)el.querySelector('.move-t').value=p.t;});
 el.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b)return;const a=b.dataset.action,ps=picks();if(a==='fullscreen'){const surface=el.querySelector('.space-canvas');if(surface.requestFullscreen)surface.requestFullscreen().catch(()=>say('Полноэкранный режим недоступен в этом браузере.',true));else say('Для крупного изображения поверни устройство горизонтально.',true);return;}if(a==='exit-fullscreen'){if(document.fullscreenElement)document.exitFullscreen();return;}if(a==='front'){state.yaw=0;state.pitch=0;}if(a==='top'){state.yaw=0;state.pitch=Math.PI/2;}if(a==='orbit'){state.yaw=.65;state.pitch=.48;}if(a==='plane')state.showPlane=!state.showPlane;if(a==='section'){state.showSection=!state.showSection;emit('hint');}
 if(a==='point'){if(state.points.length>=30)return say('На поле уже 30 построенных точек. Отмени ненужные.',true);snap();const p={id:id(),kind:'edge',edge:+el.querySelector('.edge-select').value,t:+el.querySelector('.edge-t').value};state.points.push(p);say('Точка '+p.id+' зависит от ребра. Передвинь её или измени размеры тела.');emit('construction');}
 if(a==='line'){if(ps[0]===ps[1])return say('Выбери две разные точки.',true);snap();state.lines.push({a:ps[0],b:ps[1]});say('Отрезок добавлен. Для контура сечения соедини точки X на одной грани.');emit('construction');}
 if(a==='three-plane'){const p=S.plane(...ps.slice(0,3).map(id=>coords[id]));if(!p)return say('Три точки должны быть различными и не лежать на одной прямой.',true);if(ps.slice(0,3).some(id=>id.startsWith('X')||state.points.find(p=>p.id===id)?.kind==='foot'))return say('Плоскость задавай вершинами или точками на рёбрах: точки её собственного сечения создали бы круговую зависимость.',true);snap();state.planeMode='points';state.planeIds=ps.slice(0,3);state.showSection=false;say('Секущая плоскость задана. Двигай её исходные точки: сечение будет пересчитано.');emit('construction');}
 if(a==='foot'){if(state.points.length>=30)return say('На поле уже 30 построенных точек. Отмени ненужные.',true);if(!pl)return say('Сначала задай плоскость.',true);if(ps[0].startsWith('X')||state.points.find(p=>p.id===ps[0])?.kind==='foot')return say('Выбери исходную вершину или точку ребра.',true);snap();const name=id();state.points.push({id:name,kind:'foot',source:ps[0]});state.lines.push({a:ps[0],b:name});say(name+' — ортогональная проекция точки '+ps[0]+' на плоскость.');emit('construction');}
 if(a==='measure'){measurementIds=ps.slice();updateMeasurement();}
 if(a==='check'){if(model.curved||cut.length<3)return say('Для этой проверки нужно невырожденное многоугольное сечение.',true);const required=cut.map((_,i)=>['X'+(i+1),'X'+((i+1)%cut.length+1)].sort().join('|'));const actual=state.lines.filter(l=>l.a.startsWith('X')&&l.b.startsWith('X')).map(l=>[l.a,l.b].sort().join('|'));const ok=required.every(k=>actual.includes(k))&&actual.every(k=>required.includes(k));say(ok?'Контур верен: соединены соседние точки сечения на гранях. Теперь объясни принадлежность каждого отрезка секущей плоскости.':'Контур пока не замкнут или содержит диагональ. На каждой пересекаемой грани соедини две граничные точки сечения.',!ok);emit(ok?'solved-construction':'attempt');}
 if(a==='undo'&&state.history.length){Object.assign(state,JSON.parse(state.history.pop()));emit('undo');}if(a==='clear'){snap();state.points=[];state.lines=[];state.planeMode='slider';state.planeIds=[];say('Построения очищены.');emit('clear');}refresh();});
 function pos(e){const r=cv.getBoundingClientRect();return {x:(e.clientX-r.left)*width/r.width,y:(e.clientY-r.top)*height/r.height};}
 cv.addEventListener('pointerdown',e=>{const q=pos(e),p=state.points.find(p=>p.kind==='edge'&&projected[p.id]&&Math.hypot(projected[p.id].x-q.x,projected[p.id].y-q.y)<24*width/cv.getBoundingClientRect().width);active={x:q.x,y:q.y,p:p||null,yaw:state.yaw,pitch:state.pitch};cv.setPointerCapture(e.pointerId);if(p)snap();});
 cv.addEventListener('pointermove',e=>{if(!active)return;const q=pos(e);if(active.p){const [i,j]=model.edges[active.p.edge],a=proj(model.vertices[i]),b=proj(model.vertices[j]),dx=b.x-a.x,dy=b.y-a.y;active.p.t=Math.max(0,Math.min(1,((q.x-a.x)*dx+(q.y-a.y)*dy)/(dx*dx+dy*dy||1)));emit('move-point');}else{state.yaw=active.yaw+(q.x-active.x)*.008;state.pitch=Math.max(-1.5,Math.min(1.5,active.pitch+(q.y-active.y)*.008));}draw();});for(const ev of ['pointerup','pointercancel','lostpointercapture'])cv.addEventListener(ev,()=>{active=null;fillSelects();});
 cv.addEventListener('wheel',e=>{e.preventDefault();state.zoom=Math.max(30,Math.min(100,state.zoom-e.deltaY*.05));el.querySelector('[data-param="zoom"]').value=state.zoom;draw();},{passive:false});cv.addEventListener('keydown',e=>{const k=e.key;if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','='].includes(k))return;e.preventDefault();if(k==='ArrowLeft')state.yaw-=.1;if(k==='ArrowRight')state.yaw+=.1;if(k==='ArrowUp')state.pitch=Math.max(-1.5,state.pitch-.1);if(k==='ArrowDown')state.pitch=Math.min(1.5,state.pitch+.1);if(k==='+'||k==='=')state.zoom=Math.min(100,state.zoom+3);if(k==='-')state.zoom=Math.max(30,state.zoom-3);draw();});
 for(const input of el.querySelectorAll('[data-param]'))input.value=state[input.dataset.param];refresh();return {state,redraw:refresh,get section(){return cut;},get plane(){return pl;},get coords(){return coords;},project:proj,destroy(){active=null;}};
}
root.SpaceViewer={mount};})(window);
