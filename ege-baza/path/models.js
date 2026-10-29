(function(root){'use strict';const F=PathData.F,E=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const add=(a,b)=>a.map((x,i)=>x+b[i]),sub=(a,b)=>a.map((x,i)=>x-b[i]),mul=(a,k)=>a.map(x=>x*k),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
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

// Only the five existing basic-EGE solids use these surfaces. Coordinates and
// slider state remain the learner's existing model; rotation changes the camera.
function solidModel(m,cut,angle=.65,tilt=.4){
 const {a,b,h,body}=m,faces=[],lines=[],count=120;
 const line=(p,q,id,color='#16715b',surface=false)=>lines.push({a:p,b:q,id,color,surface});
 const ring=(r,z)=>Array.from({length:count},(_,i)=>[r*Math.cos(i*2*Math.PI/count),r*Math.sin(i*2*Math.PI/count),z]);
 const outline=(points,id,color,surface=false)=>points.forEach((p,i)=>line(p,points[(i+1)%points.length],id+'-'+i,color,surface));
 if(body==='box'||body==='pyramid'){
  const base=[[-a/2,-b/2,0],[a/2,-b/2,0],[a/2,b/2,0],[-a/2,b/2,0]];
  faces.push(base);outline(base,'base');
  if(body==='box'){
   const top=base.map(([x,y])=>[x,y,h]);faces.push(top);outline(top,'top');
   base.forEach((p,i)=>{const j=(i+1)%4;faces.push([p,base[j],top[j],top[i]]);line(p,top[i],'side-'+i);});
  }else base.forEach((p,i)=>{faces.push([p,base[(i+1)%4],[0,0,h]]);line(p,[0,0,h],'side-'+i);});
 }else if(body==='sphere'){
  for(let j=-3;j<=3;j++){const z=a*j/4;outline(ring(Math.sqrt(a*a-z*z),z),'latitude-'+j,undefined,true);}
  for(let j=0;j<4;j++){
   const u=j*Math.PI/4,points=Array.from({length:count},(_,i)=>{const t=i*2*Math.PI/count;return[a*Math.cos(t)*Math.cos(u),a*Math.cos(t)*Math.sin(u),a*Math.sin(t)];});
   outline(points,'meridian-'+j,undefined,true);
  }
  const u=[Math.cos(angle),-Math.sin(angle),0],v=[-Math.sin(angle)*Math.sin(tilt),-Math.cos(angle)*Math.sin(tilt),Math.cos(tilt)];
  outline(Array.from({length:count},(_,i)=>{const t=i*2*Math.PI/count;return add(mul(u,a*Math.cos(t)),mul(v,a*Math.sin(t)));}),'silhouette',undefined,true);
 }else{
  const base=ring(a,0),top=body==='cylinder'?ring(a,h):null,apex=[0,0,h];faces.push(base);outline(base,'base');
  if(top){faces.push(top);outline(top,'top');}
  base.forEach((p,i)=>{const j=(i+1)%count;faces.push(top?[p,base[j],top[j],top[i]]:[p,base[j],apex]);});
  for(let i=0;i<count;i+=count/12)line(base[i],top?top[i]:apex,'generator-'+i,'#799e8f');
  // The twelve construction generators are not an outline. Add the actual
  // tangent generators for this camera, even between the mesh sample angles.
  const tangent=body==='cylinder'?0:-a*Math.tan(tilt)/h;
  if(Math.abs(tangent)<1){const center=Math.PI/2-angle,offset=Math.acos(tangent);[center-offset,center+offset].forEach((t,i)=>{
   const p=[a*Math.cos(t),a*Math.sin(t),0];line(p,top?[p[0],p[1],h]:apex,'silhouette-'+i);
  });}
  if(m.section)outline(base.map(p=>add(mul(p,cut),[0,0,h*(1-cut)])),'section','#c36b34');
 }
 line([0,0,0],body==='sphere'?[a,0,0]:[0,0,h],'axis','#c36b34');
 return {faces,lines,sphere:body==='sphere'?{center:[0,0,0],radius:a}:null};
}
function solidDrawing(m,angle,tilt,cut){
 const model=solidModel(m,cut,angle,tilt),rotate=([x,y,z])=>{
  const depth=x*Math.sin(angle)+y*Math.cos(angle);
  return [x*Math.cos(angle)-y*Math.sin(angle),z*Math.cos(tilt)-depth*Math.sin(tilt),z*Math.sin(tilt)+depth*Math.cos(tilt)];
 };
 const points=model.lines.flatMap(l=>[rotate(l.a),rotate(l.b)]),lo=[0,1].map(i=>Math.min(...points.map(p=>p[i]))),hi=[0,1].map(i=>Math.max(...points.map(p=>p[i])));
 const scale=Math.min(550/Math.max(hi[0]-lo[0],.001),300/Math.max(hi[1]-lo[1],.001));
 const project=p=>[300+(p[0]-(lo[0]+hi[0])/2)*scale,175-(p[1]-(lo[1]+hi[1])/2)*scale];
 const surfaces=model.faces.map(face=>{const vertices=face.map(rotate),normal=cross(sub(vertices[1],vertices[0]),sub(vertices[2],vertices[0]));return {vertices,normal:mul(normal,1/Math.hypot(...normal))};});
 const tolerance=Math.max(m.a,m.b,m.h)*1e-8,parts=[];
 for(const line of model.lines){
  const a=rotate(line.a),b=rotate(line.b),occluders=model.sphere?[{sphere:{center:rotate(model.sphere.center),radius:model.sphere.radius},surface:line.surface}]:surfaces;
  for(const part of visibilityParts(a,b,occluders,tolerance)){
   const p=project(add(a,mul(sub(b,a),part.start))),q=project(add(a,mul(sub(b,a),part.end)));
   // One absolute phase for every collinear stroke, including reversed spans.
   const dx=q[0]-p[0],dy=q[1]-p[1],length=Math.hypot(dx,dy),direction=Math.abs(dx)>length*1e-10?Math.sign(dx):Math.sign(dy);
   const along=length?(p[0]*dx+p[1]*dy)/length*direction:0,offset=((direction>0?along:5-along)%10).toFixed(6);
   parts.push({hidden:part.hidden,html:`<path data-solid-line="${line.id}" data-hidden="${part.hidden}" data-part-start="${part.start}" data-part-end="${part.end}" d="M${p}L${q}" fill="none" stroke="${line.color}" stroke-width="2.5" stroke-dasharray="${part.hidden?'5 5':'none'}"${part.hidden?` stroke-dashoffset="${offset}"`:''}/>`});
  }
 }
 // A visible stroke at a crossing stays above a hidden one.
 return parts.sort((a,b)=>Number(b.hidden)-Number(a.hidden)).map(p=>p.html).join('');
}
function mount(el,t,options={}){const m=t.model,kind=m.kind;const session=PathModels.session(el,kind,options),v=session.value,changed=session.changed;let svg,step=v.revealed||0;const shell=(h)=>{el.innerHTML=h;},axis='<path d="M35 175H565M300 20V320" stroke="#829288"/>';
const slider=(id,label,min,max,val,st=1)=>`<label>${label} <output id="${id}out">${F(val)}</output><input id="${id}" type="range" min="${min}" max="${max}" step="${st}" value="${val}"></label>`;
const bind=(id,fn)=>{el.querySelector('#'+id).oninput=e=>{el.querySelector('#'+id+'out').textContent=F(+e.target.value);fn(+e.target.value);changed();};};
const frame='<svg viewBox="0 0 600 350" role="img" aria-label="Математическая модель"></svg><p id="modelread" aria-live="polite"></p>';
if(kind==='equation'){
 let a=structuredClone(v.left||m.left),b=structuredClone(v.right||m.right),pending=v.pending||null,sign=v.sign||0,busy=false;
 const coefficient=terms=>terms.reduce((sum,[value,power])=>sum+(power===1?value:0),0),suggestedDivisor=coefficient(m.left)-coefficient(m.right);
 let divisor=typeof v.divisor==='string'?v.divisor:(suggestedDivisor===0?'':String(suggestedDivisor)),message=v.message||'';
 const term=([n,p])=>(n<0?'−':'+')+(Math.abs(n)===1&&p?'':F(Math.abs(n)))+(p?'x':'');
 const text=xs=>xs.map(term).join(' ').replace(/^\+/,'')||'0';
 const sync=()=>Object.assign(v,{left:structuredClone(a),right:structuredClone(b),pending,sign,divisor,message});
 const publish=()=>{sync();changed();};
 function transfer(){
  const target=el.querySelector('#transfer');target.replaceChildren();if(!pending)return;
  const {side:s,index:i}=pending,xs=s?b:a,value=xs[i];if(!value){pending=null;sign=0;return;}
  target.innerHTML=`<p>Переносим <b>${term(value)}</b>. Какой знак будет у этого слагаемого в другой части?</p><button data-sign="1">Плюс</button> <button data-sign="-1">Минус</button><p id="signwhy"></p>`;
  const why=el.querySelector('#signwhy'),opposite=[-value[0],value[1]];
  if(sign===1)why.textContent='Нужен противоположный знак: прибавляем противоположное слагаемое к обеим частям.';
  if(sign===2){
   why.innerHTML=`Одинаковое действие: <b>(${E(text(a))}) ${term(opposite)} = (${E(text(b))}) ${term(opposite)}</b>.<br>В исходной части ${term(value)} ${term(opposite)} = 0. В другой части остаётся ${term(opposite)}.<br><button id="moveTerm">Показать перенос</button>`;
   el.querySelector('#moveTerm').onclick=async()=>{
    if(busy)return;busy=true;const btn=el.querySelector(`[data-s="${s}"][data-i="${i}"]`),dest=el.querySelector(`[data-side="${1-s}"]`),r=btn.getBoundingClientRect(),to=dest.getBoundingClientRect();
    const ghost=btn.cloneNode(true);ghost.classList.add('moving-term');Object.assign(ghost.style,{position:'fixed',left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px',zIndex:1000,pointerEvents:'none'});document.body.append(ghost);
    const noMotion=matchMedia('(prefers-reduced-motion: reduce)').matches||document.getElementById('reduceMotion')?.checked;
    if(!noMotion){const anim=ghost.animate([{transform:'translate(0,0)'},{transform:`translate(${to.left-r.left+12}px,${to.top-r.top-25}px)`}],{duration:650,easing:'ease-in-out'});const timer=setTimeout(()=>ghost.textContent=term(opposite),320);await anim.finished.catch(()=>{});clearTimeout(timer);}
    ghost.remove();busy=false;if(!el.isConnected)return;
    xs.splice(i,1);(s?a:b).push(opposite);pending=null;sign=0;message='Равенство сохранено: '+text(a)+' = '+text(b)+'. Теперь можно собрать подобные слагаемые.';draw();publish();
   };
  }
  el.querySelectorAll('[data-sign]').forEach(btn=>btn.onclick=()=>{sign=+btn.dataset.sign===-Math.sign(value[0])?2:1;transfer();publish();});
 }
 function select(side,index){if(busy)return;const xs=side?b:a;if(!xs[index])return;pending={side,index};sign=0;transfer();publish();}
 function draw(){
  shell(`<p>Выбери слагаемое кнопкой или перетащи его через знак равенства. Чтобы собрать подобные, нажми отдельную кнопку.</p><div class="equation-work"><div class="eq-side" data-side="0">${a.map((x,i)=>`<button draggable="true" data-i="${i}" data-s="0" class="term">${term(x)}</button>`).join('')||'0'}</div><b class="equal">=</b><div class="eq-side" data-side="1">${b.map((x,i)=>`<button draggable="true" data-i="${i}" data-s="1" class="term">${term(x)}</button>`).join('')||'0'}</div></div><div id="transfer" aria-live="polite"></div><div class="tools"><button id="collect">Собрать подобные</button><label>Разделить обе части на <input id="divisor" inputmode="decimal" size="4"></label><button id="divide">Разделить</button><button id="resetEq">Исходное уравнение</button></div><p id="eqFeedback" role="status"></p>`);
  el.querySelector('#eqFeedback').textContent=message||'Слагаемое переносится целиком вместе со знаком. Коэффициент x — множитель, его отдельно «переносить со сменой знака» нельзя.';
  const input=el.querySelector('#divisor');input.value=divisor;input.oninput=()=>{divisor=input.value.slice(0,80);publish();};
  el.querySelectorAll('.term').forEach(btn=>{btn.onclick=()=>select(+btn.dataset.s,+btn.dataset.i);btn.ondragstart=e=>e.dataTransfer.setData('text/plain',btn.dataset.s+','+btn.dataset.i);btn.onpointerdown=e=>{if(e.pointerType!=='mouse')btn._start={x:e.clientX,y:e.clientY};};btn.onpointerup=e=>{const q=btn._start;if(!q||Math.hypot(e.clientX-q.x,e.clientY-q.y)<20)return;const r=el.querySelector(`[data-side="${1-Number(btn.dataset.s)}"]`).getBoundingClientRect();if(e.clientX>=r.left&&e.clientX<=r.right)select(+btn.dataset.s,+btn.dataset.i);};});
  el.querySelectorAll('.eq-side').forEach(side=>{side.ondragover=e=>e.preventDefault();side.ondrop=e=>{e.preventDefault();const match=e.dataTransfer.getData('text/plain').match(/^([01]),(\d+)$/);if(match&&+match[1]!==+side.dataset.side)select(+match[1],+match[2]);};});
  el.querySelector('#collect').onclick=()=>{if(busy)return;const group=xs=>[1,0].map(p=>[xs.filter(x=>x[1]===p).reduce((z,x)=>z+x[0],0),p]).filter(x=>Math.abs(x[0])>1e-10);a=group(a);b=group(b);pending=null;sign=0;message='Сложены только коэффициенты при одинаковых степенях x. Равенство сохранено.';draw();publish();};
  el.querySelector('#divide').onclick=()=>{if(busy)return;const d=PathData.parse(divisor);if(d===null||d===0){message='На ноль делить нельзя. Введи ненулевое число.';}else if([...a,...b].some(([x])=>!Number.isFinite(x/d)||Math.abs(x/d)>1e9)){message='Выберите делитель, который оставит числа в рабочем диапазоне модели.';}else{a=a.map(([x,p])=>[x/d,p]);b=b.map(([x,p])=>[x/d,p]);pending=null;sign=0;message=`Каждое слагаемое обеих частей разделено на ${F(d)}. Множитель не превращается в слагаемое.`;}draw();publish();};
  el.querySelector('#resetEq').onclick=()=>{if(busy)return;a=structuredClone(m.left);b=structuredClone(m.right);pending=null;sign=0;message='';draw();publish();};transfer();sync();
 }
 draw();return session;
}
if(kind==='derivative'){let x=v.x??m.x,h=v.h??1;Object.assign(v,{x,h});shell(frame+slider('px','Точка x',-2,2,x,.25)+slider('dh','Шаг h',.05,2,h,.05));svg=el.querySelector('svg');const draw=()=>{let X=v=>300+v*80,Y=v=>300-v*55,path='';for(let v=-2.2;v<=2.2;v+=.04)path+=(path?'L':'M')+X(v)+','+Y(v*v);const slope=2*x+h;svg.innerHTML=`<path d="M30 300H570M300 15V330" stroke="#87958c"/><path d="${path}" fill="none" stroke="#16715b" stroke-width="4"/><path d="M${X(-3)} ${Y(x*x+slope*(-3-x))}L${X(3)} ${Y(x*x+slope*(3-x))}" stroke="#c36b34" stroke-width="3"/><path d="M${X(-3)} ${Y(x*x+2*x*(-3-x))}L${X(3)} ${Y(x*x+2*x*(3-x))}" stroke="#536cc5" stroke-width="3" stroke-dasharray="6"/><circle cx="${X(x)}" cy="${Y(x*x)}" r="7" fill="#16715b"/><circle cx="${X(x+h)}" cy="${Y((x+h)**2)}" r="7" fill="#c36b34"/>`;el.querySelector('#modelread').textContent=`Высота f(x)=${F(x*x)}. Наклон секущей Δy/Δx=${F(slope)}. При h→0 наклон стремится к 2x=${F(2*x)}: ${x<0?'убывание':x>0?'рост':'горизонтальная касательная'}. Оранжевая — секущая, пунктирная — касательная.`;};bind('px',v=>{x=v;session.value.x=x;draw();});bind('dh',v=>{h=v;session.value.h=h;draw();});draw();return session;}
if(kind==='solid'){
 let angle=v.angle??.65,tilt=v.tilt??.4,cut=v.cut??1/3;Object.assign(v,{angle,tilt,cut});
 shell(frame+slider('angle','Поворот',-180,180,angle*180/Math.PI)+slider('tilt','Наклон',-70,70,tilt*180/Math.PI)+(m.section?slider('cut','Высота малого конуса / всей высоты',.1,.9,cut,.05):'')+'<p>Размеры тела фиксированы условием. Поворот меняет только ракурс. Закрытые поверхностью части линий показаны пунктиром; видимые — сплошными.</p>');
 svg=el.querySelector('svg');
 const draw=()=>{
  svg.innerHTML=solidDrawing(m,angle,tilt,cut);
  el.querySelector('#modelread').textContent=m.section?`Высота: k=${F(cut)}. Радиус: k. Площадь: k²=${F(cut*cut)}. Объём: k³=${F(cut**3)}. Сечение показано на расстоянии k·h от вершины.`:m.body==='sphere'?'Шар. Выделенный отрезок соединяет центр с поверхностью: это радиус. Объём зависит от куба радиуса.':`Модель: ${m.body}. Сравни рёбра, грани и высоту. Формула объёма использует перпендикулярную высоту, а не наклонную линию.`;
 };
 bind('angle',v=>{angle=v*Math.PI/180;session.value.angle=angle;draw();});bind('tilt',v=>{tilt=v*Math.PI/180;session.value.tilt=tilt;draw();});if(m.section)bind('cut',v=>{cut=v;session.value.cut=cut;draw();});let dragging=false,last=0;svg.style.touchAction='none';svg.onpointerdown=e=>{dragging=true;last=e.clientX;svg.setPointerCapture(e.pointerId);};svg.onpointermove=e=>{if(dragging){angle+=(e.clientX-last)*.01;angle=((angle+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;last=e.clientX;v.angle=angle;el.querySelector('#angle').value=angle*180/Math.PI;el.querySelector('#angleout').textContent=F(angle*180/Math.PI);draw();changed();}};svg.onpointerup=svg.onpointercancel=()=>dragging=false;draw();return session;}
if(['iso','triangle','trapezoid','chord','rectangle'].includes(kind)){shell(frame+'<div class="tools"><button id="build">Выбрать вспомогательное построение</button><div id="choices"></div></div>');svg=el.querySelector('svg');let constructed=!!v.constructed,choicesOpen=!!v.choicesOpen,wrong=!!v.wrong;Object.assign(v,{constructed,choicesOpen,wrong});const draw=()=>{let x='';if(kind==='iso'||kind==='triangle'){x='<path d="M100 280L500 280L'+(kind==='iso'?'300 40':'100 40')+'Z" fill="#dce9db" stroke="#16715b" stroke-width="3"/><text x="280" y="315">основание</text>';if(constructed)x+=kind==='iso'?'<path d="M300 40V280" stroke="#c36b34" stroke-width="4"/><path d="M300 260h20v20" fill="none" stroke="#c36b34"/>':'<path d="M100 40H500V280" fill="none" stroke="#c36b34" stroke-width="3" stroke-dasharray="6"/>';}else if(kind==='chord'){x='<circle cx="300" cy="160" r="125" fill="#f3f3e8" stroke="#16715b" stroke-width="3"/><path d="M200 235H400" stroke="#16715b" stroke-width="4"/><circle cx="300" cy="160" r="5"/>';if(constructed)x+='<path d="M300 160V235H400Z" fill="none" stroke="#c36b34" stroke-width="3"/><path d="M300 220h15v15" fill="none" stroke="#c36b34"/>';}else{x='<path d="M80 275L510 275L'+(kind==='rectangle'?'510':'420')+'70L'+(kind==='rectangle'?'80':'180')+'70Z" fill="#dce9db" stroke="#16715b" stroke-width="3"/>';if(constructed)x+='<path d="M180 70V275M180 255h20v20" fill="none" stroke="#c36b34" stroke-width="3"/>';}svg.innerHTML=x;el.querySelector('#modelread').textContent=constructed?'Построение выполнено. Теперь назови новое свойство и используй его в пошаговом расчёте. Чертёж схематический: длины берём из условия.':'Сначала реши, какая линия поможет. Чертёж схематический; измерять ответ по экрану нельзя.';if(wrong)el.querySelector('#modelread').textContent='Произвольная линия не даёт нужного свойства. Для формулы площади и теоремы Пифагора нужен прямой угол.';};const choose=()=>{el.querySelector('#choices').innerHTML='<p>Что полезно построить?</p>'+[kind==='triangle'?'Достроить до прямоугольника':kind==='chord'?'Перпендикуляр от центра к хорде':kind==='rectangle'?'Перпендикулярную сторону': 'Перпендикуляр к основанию','Произвольную наклонную линию'].map((x,i)=>`<button data-choice="${i}">${x}</button>`).join('');el.querySelectorAll('[data-choice]').forEach(btn=>btn.onclick=()=>{if(btn.dataset.choice==='0'){constructed=true;wrong=false;}else wrong=true;Object.assign(v,{constructed,wrong});draw();changed();});};el.querySelector('#build').onclick=()=>{choicesOpen=true;v.choicesOpen=true;choose();changed();};if(choicesOpen)choose();draw();return session;}
if(kind==='digits'){let kept=v.kept?[...v.kept]:[...m.digits].map(()=>true);v.kept=kept;shell(`<p>Нажимай цифры, которые нужно вычеркнуть. Повторное нажатие возвращает цифру.</p><div class="digit-row">${[...m.digits].map((v,i)=>`<button data-digit="${i}" aria-pressed="false">${v}</button>`).join('')}</div><p id="digitread" aria-live="polite"></p>`);let draw=()=>{let s=[...m.digits].filter((_,i)=>kept[i]).join(''),diff=[...s].reduce((a,c,i)=>a+(i%2?-1:1)*+c,0);el.querySelector('#digitread').textContent=`Осталось ${s.length} цифр: ${s||'—'}. Чередующаяся сумма: ${diff}. ${s.length===5&&PathData.digits22(s,m.digits)?'Все условия выполнены.':'Нужны ровно пять цифр, чётный конец и чередующаяся сумма, кратная 11.'}`;};el.querySelectorAll('[data-digit]').forEach(b=>b.onclick=()=>{kept[+b.dataset.digit]=!kept[+b.dataset.digit];b.setAttribute('aria-pressed',String(!kept[+b.dataset.digit]));draw();changed();});el.querySelectorAll('[data-digit]').forEach(b=>b.setAttribute('aria-pressed',String(!kept[+b.dataset.digit])));draw();return session;}
if(kind==='journey'){v.part=v.part??1;shell(frame+slider('part','Показать участок',1,3,v.part));svg=el.querySelector('svg');let draw=n=>{v.part=n;const sum=m.dist.reduce((a,b)=>a+b,0);let x=40;svg.innerHTML=m.dist.map((d,i)=>{let w=d/sum*520,s=`<rect x="${x}" y="100" width="${w}" height="60" fill="${i===n-1?'#c36b34':'#b7d4c0'}" stroke="white"/><text x="${x+w/2}" y="200" text-anchor="middle">${d} км</text>`;x+=w;return s;}).join('');el.querySelector('#modelread').textContent=`Участок ${n}: ${m.dist[n-1]} / ${m.speed[n-1]} = ${F(m.dist[n-1]/m.speed[n-1])} ч. Сравни не только скорости, но и время на каждом участке.`;};bind('part',draw);draw(v.part);return session;}
if(kind==='ring'){shell(frame+'<button id="opposite">Разместить C и D по разные стороны от A</button><button id="length">Восстановить длину кольца</button>');svg=el.querySelector('svg');let mode=v.mode??0;v.mode=mode;const draw=()=>{let positions=mode?[0,110,85,165]:[0,110,85,55],L=220;const pt=s=>[300+125*Math.sin(2*Math.PI*s/L),175-125*Math.cos(2*Math.PI*s/L)];svg.innerHTML='<circle cx="300" cy="175" r="125" fill="none" stroke="#16715b" stroke-width="4"/>'+positions.map((s,i)=>{let[x,y]=pt(s);return `<circle cx="${x}" cy="${y}" r="7" fill="#c36b34"/><text x="${300+(x-300)*1.17}" y="${181+(y-175)*1.17}" text-anchor="middle">${'ABCD'[i]}</text>`;}).join('');el.querySelector('#modelread').textContent=mode===0?'Пробуем C и D с одной стороны: расстояние между ними не больше AC−AD. Условие не выполняется. Масштаб рисунка пока гипотеза.':mode===1?'C и D с разных сторон. Дуга через A равна AC+AD. Она длиннее CD, значит CD — другая дуга. Их сумма даст длину кольца.':`Длина кольца ${220*m.scale}. AB=${110*m.scale} — половина кольца. B напротив A, поэтому BC=${25*m.scale}.`;};el.querySelector('#opposite').onclick=()=>{mode=1;v.mode=mode;draw();changed();};el.querySelector('#length').onclick=()=>{mode=2;v.mode=mode;draw();changed();};draw();return session;}
if(kind==='line'){v.x=v.x??0;shell(frame+slider('testx','Проверить число x',m.a-2,m.b+2,v.x));svg=el.querySelector('svg');const draw=x=>{v.x=x;const X=v=>50+(v-(m.a-2))/(m.b-m.a+4)*500;svg.innerHTML=`<path d="M40 180H560" stroke="#7f978b"/><path d="M${X(m.a)} 180H${X(m.b)}" stroke="#16715b" stroke-width="8"/><circle cx="${X(m.a)}" cy="180" r="8" fill="white" stroke="#16715b" stroke-width="3"/><circle cx="${X(m.b)}" cy="180" r="8" fill="#16715b"/><circle cx="${X(x)}" cy="145" r="8" fill="#c36b34"/><text x="${X(m.a)}" y="215">${m.a}</text><text x="${X(m.b)}" y="215">${m.b}</text>`;el.querySelector('#modelread').textContent=`x=${x}: ${x>m.a&&x<=m.b?'подходит':'не подходит'}. Левая граница пустая, правая закрашена.`;};bind('testx',draw);draw(v.x);return session;}
if(kind==='bars'){shell(frame);svg=el.querySelector('svg');svg.innerHTML=m.values.map((v,i)=>`<rect x="${60+130*i}" y="${290-v*15}" width="70" height="${v*15}" fill="#16715b"/><text x="${95+130*i}" y="${280-v*15}" text-anchor="middle">${v}</text><text x="${95+130*i}" y="320" text-anchor="middle">${['Пн','Вт','Ср','Чт'][i]}</text>`).join('');el.querySelector('#modelread').textContent='Читай подписи, затем выбирай нужные столбцы. Высота показывает количество посетителей.';return session;}
shell(`<p>Перед вычислением собери план решения. Открывай смысл шагов по одному, затем реши новый вариант без опоры.</p><div id="plan"></div><button id="revealPlan">Следующий смысловой шаг</button>`);
const drawPlan=()=>{el.querySelector('#plan').innerHTML=t.steps.slice(0,step).map((x,i)=>`<p><b>${i+1}.</b> ${E(x.why)}</p>`).join('');el.querySelector('#revealPlan').disabled=step>=t.steps.length;v.revealed=step;};
el.querySelector('#revealPlan').onclick=()=>{if(step<t.steps.length){step++;drawPlan();changed();}};drawPlan();return session;}
// Each model exports semantic values; no DOM snapshot is used to restore it.
function session(el,kind,options){
 const value=options.state?structuredClone(options.state):{kind};value.kind=kind;
 const api={value,getState:()=>structuredClone(value),changed:()=>{if(el.isConnected&&typeof options.onChange==='function')options.onChange(api.getState());}};
 el.pathModel=api;return api;
}
root.PathModels={mount,session,solidModel};})(window);
