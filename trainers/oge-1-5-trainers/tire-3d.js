/* Tire marking in millimetres. A schematic solid of revolution, not a tyre CAD
 * profile: section width B is measured at the bulging sidewalls; tread is narrower.
 * No answer keys, learner answers, scores, storage or network access. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.Tire3D=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const TAU=2*Math.PI,green='#176747';
 const presets={quarter:{yaw:-38,pitch:-12},front:{yaw:0,pitch:0},tread:{yaw:90,pitch:0}};
 const frame={width:420,height:400,cx:210,cy:195,scale:.37};
 const fmt=n=>Number(n.toFixed(2)).toLocaleString('ru-RU');
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let serial=0;
 function dimensions({B=195,p=60,d=15}={}){
  [B,p,d].forEach(n=>{if(!Number.isFinite(n)||n<=0)throw new RangeError('Tire dimensions must be positive finite numbers');});
  const H=B*p/100,dm=d*25.4,r=dm/2,R=r+H;
  return {B,p,d,H,dm,r,R,D:2*R};
 }
 function rotate(v,{yaw=0,pitch=0}={}){
  const y=yaw*Math.PI/180,p=pitch*Math.PI/180,cy=Math.cos(y),sy=Math.sin(y),cp=Math.cos(p),sp=Math.sin(p);
  const x=cy*v[0]+sy*v[2],z=-sy*v[0]+cy*v[2];
  return [x,cp*v[1]-sp*z,sp*v[1]+cp*z];
 }
 function project(v,view=presets.quarter){const a=rotate(v,view);return [frame.cx+a[0]*frame.scale,frame.cy-a[1]*frame.scale,a[2]];}
 function radial(r,z,a){return [r*Math.cos(a),r*Math.sin(a),z];}
 function buildMesh(dim,segments=48){
  if(!Number.isInteger(segments)||segments<12||segments%4)throw new RangeError('Use a multiple of four angular segments');
  const {r,R,H,B}=dim;
  const section=[[r,-.34*B],[r+.25*H,-.46*B],[r+.55*H,-B/2],[r+.88*H,-.46*B],[R,-.40*B],[R,.40*B],[r+.88*H,.46*B],[r+.55*H,B/2],[r+.25*H,.46*B],[r,.34*B]];
  const faces=[];
  for(let j=0;j<section.length;j++)for(let i=0;i<segments;i++){
   const next=(j+1)%section.length,a=TAU*i/segments,b=TAU*(i+1)/segments;
   faces.push({material:j===4?'tread':'sidewall',points:[radial(...section[j],a),radial(...section[j],b),radial(...section[next],b),radial(...section[next],a)]});
  }
  // Metal ring, six spokes and hub do not overlap in their face plane. This
  // avoids painter-order artefacts from placing decorative spokes on a disc.
  for(let i=0;i<segments;i++){
   const a=TAU*i/segments,b=TAU*(i+1)/segments;
   faces.push({material:'rim',points:[radial(.85*r,-.34*B,a),radial(.85*r,-.34*B,b),radial(.85*r,.34*B,b),radial(.85*r,.34*B,a)]});
  }
  for(const sign of [-1,1]){
   const z=sign*.34*B;
   for(let i=0;i<segments;i++){
    const a=TAU*i/segments,b=TAU*(i+1)/segments;
    faces.push({material:'rim',points:[radial(.85*r,z,a),radial(r,z,a),radial(r,z,b),radial(.85*r,z,b)]});
    if(sign===1)faces.push({material:'hub',points:[[0,0,z],radial(.16*r,z,a),radial(.16*r,z,b)]});
   }
   if(sign===1)for(let i=0;i<6;i++){
    const a=TAU*i/6;
    faces.push({material:'spoke',points:[radial(.16*r,z,a-.12),radial(.85*r,z,a-.065),radial(.85*r,z,a+.065),radial(.16*r,z,a+.12)]});
   }
  }
  return {section,faces,segments};
 }
 function measurement(dim,part){
  const {B,H,r,R,dm,D}=dim,z=.56*B;
  if(part==='width'){
   const y=r+.55*H,guide=R+34;
   return {symbol:'B',value:B,points:[[0,y,-B/2],[0,y,B/2]],line:[[0,guide,-B/2],[0,guide,B/2]],direction:'axial'};
  }
  if(part==='side')return {symbol:'H',value:H,points:[[0,r,.34*B],[0,R,.34*B]],line:[[0,r,z],[0,R,z]],direction:'radial'};
  if(part==='disk')return {symbol:'d',value:dm,points:[[0,-r,.34*B],[0,r,.34*B]],line:[[0,-r,z],[0,r,z]],direction:'diameter'};
  if(part==='radius')return {symbol:'R',value:R,points:[[0,0,0],[R,0,0]],line:[[0,0,z],[R,0,z]],direction:'radial'};
  return {symbol:'D',value:D,points:[[0,-R,.40*B],[0,R,.40*B]],line:[[0,-R,z],[0,R,z]],direction:'diameter'};
 }
 function norm(v){const n=Math.hypot(...v)||1;return v.map(x=>x/n);}
 function faceColor(face,view,part){
  const [a,b,c]=face.points,u=b.map((v,i)=>v-a[i]),v=c.map((n,i)=>n-a[i]);
  const n=norm(rotate([u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],view));
  const light=.48+.52*Math.abs(n[0]*-.35+n[1]*.55+n[2]*.76);
  const selected=part==='side'&&face.material==='sidewall'||part==='all'&&face.material==='tread';
  const base=selected?[45,123,85]:face.material==='rim'?[173,185,183]:face.material==='spoke'?[221,229,224]:face.material==='hub'?[101,122,113]:face.material==='tread'?[46,57,51]:[61,73,66];
  return 'rgb('+base.map(x=>Math.round(x*light)).join(',')+')';
 }
 function path(points){return points.map(p=>p[0].toFixed(2)+','+p[1].toFixed(2)).join(' ');}
 function circlePath(r,z,view){return path(Array.from({length:65},(_,i)=>project(radial(r,z,i*TAU/64),view)));}
 function renderSvg(dim,view=presets.quarter,part='width',id='tire3d',compare=false){
  const mesh=buildMesh(dim),m=measurement(dim,part);
  const faces=mesh.faces.map(f=>({face:f,points:f.points.map(v=>project(v,view))})).sort((a,b)=>a.points.reduce((s,p)=>s+p[2],0)/a.points.length-b.points.reduce((s,p)=>s+p[2],0)/b.points.length);
  let html=`<defs><marker id="${id}-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M10 1L1 5L10 9" fill="none" stroke="${green}" stroke-width="2"/></marker></defs>`;
  html+='<g data-tire-solid="1" aria-hidden="true">';
  for(const {face,points}of faces){const color=faceColor(face,view,part);html+=`<polygon points="${path(points)}" fill="${color}" stroke="${color}" stroke-width=".35"/>`;}
  html+='</g>';
  if(compare){
   const baseline=dimensions({B:dim.B,p:60,d:dim.d});
   html+=`<g data-tire-baseline="60" fill="none" stroke="#56846e" stroke-width="1.6" stroke-dasharray="4 4" opacity=".85"><polyline points="${circlePath(baseline.R,-.40*dim.B,view)}"/><polyline points="${circlePath(baseline.R,.40*dim.B,view)}"/></g>`;
  }
  const ends=m.line.map(v=>project(v,view)),touch=m.points.map(v=>project(v,view)),length=Math.hypot(ends[1][0]-ends[0][0],ends[1][1]-ends[0][1]);
  html+=`<g data-tire-dimension="${part}" data-world-value="${m.value}" fill="none" stroke="${green}" stroke-linecap="round">`;
  touch.forEach((p,i)=>{html+=`<line x1="${p[0]}" y1="${p[1]}" x2="${ends[i][0]}" y2="${ends[i][1]}" stroke-width="1.3" stroke-dasharray="3 3"/><circle cx="${p[0]}" cy="${p[1]}" r="3" fill="#fff" stroke-width="2"/>`;});
  if(length>9)html+=`<line x1="${ends[0][0]}" y1="${ends[0][1]}" x2="${ends[1][0]}" y2="${ends[1][1]}" stroke="#fff" stroke-width="6"/><line x1="${ends[0][0]}" y1="${ends[0][1]}" x2="${ends[1][0]}" y2="${ends[1][1]}" stroke-width="2.5" marker-start="url(#${id}-arrow)" marker-end="url(#${id}-arrow)"/>`;
  const dx=ends[1][0]-ends[0][0],dy=ends[1][1]-ends[0][1],offset=length>9?[-dy/length*19,dx/length*19]:[18,-8];
  const mid=[(ends[0][0]+ends[1][0])/2,(ends[0][1]+ends[1][1])/2];
  const candidate=[mid[0]+offset[0],mid[1]+offset[1]];
  const safe=candidate[0]>=22&&candidate[0]<=frame.width-22&&candidate[1]>=22&&candidate[1]<=frame.height-22;
  const x=Math.max(22,Math.min(frame.width-22,mid[0]+(safe?1:-1)*offset[0])),y=Math.max(22,Math.min(frame.height-22,mid[1]+(safe?1:-1)*offset[1]));
  html+=`<text x="${x}" y="${y}" fill="${green}" stroke="#fff" stroke-width="4" paint-order="stroke" font-size="25" font-weight="700" text-anchor="middle" dominant-baseline="middle">${m.symbol}</text></g>`;
  return html;
 }
 function selectedText(dim,part){
  const {B,p,d,H,dm,D,R}=dim;
  if(part==='width')return `B = ${fmt(B)} мм — ширина между самыми выпуклыми частями боковин.`;
  if(part==='side')return `H = ${fmt(H)} мм — высота профиля: ${fmt(B)} · ${fmt(p)} ÷ 100.`;
  if(part==='disk')return `Диаметр диска: ${fmt(dm)} мм = ${fmt(d)} · 25,4.`;
  if(part==='radius')return `Радиус: ${fmt(R)} мм = ${fmt(D)} ÷ 2.`;
  return `D = ${fmt(D)} мм: ${fmt(H)} + ${fmt(dm)} + ${fmt(H)}.`;
 }
 function mount(host,{kind='wheel'}={}){
  const doc=host.ownerDocument,win=doc.defaultView,id='tire3d-'+(++serial),compare=kind==='wheel-compare';
  const el=(tag,text,cls)=>{const n=doc.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
  const root=el('div',null,'t3d-root');root.dataset.tire3d='1';host.append(root);
  const marking=el('p',null,'t3d-marking');root.append(marking);
  const stage=el('div',null,'pd-picture t3d-stage');stage.tabIndex=0;stage.setAttribute('role','group');stage.setAttribute('aria-label','Вращать колесо: потяни мышью или пальцем, либо нажимай стрелки. Home — объёмный вид.');stage.setAttribute('aria-keyshortcuts','ArrowLeft ArrowRight ArrowUp ArrowDown Home');root.append(stage);
  const svg=doc.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox',`0 0 ${frame.width} ${frame.height}`);svg.setAttribute('role','img');stage.append(svg);
  const read=el('p',null,'pd-reading t3d-reading');read.setAttribute('aria-live','polite');root.append(read);
  const viewNote=el('p',null,'pd-note t3d-view-note');root.append(viewNote);
  const views=el('div',null,'t3d-views');views.setAttribute('aria-label','Выбери вид колеса');root.append(views);
  const controls=el('div',null,'pd-controls t3d-controls');root.append(controls);
  function range(key,label,min,max,value,step){const box=el('label',null,'pd-control'),name=el('span',label),out=el('output',fmt(value)),input=el('input');input.type='range';Object.assign(input,{min,max,value,step});input.dataset.pdKey=key;input.setAttribute('aria-label',label);input.addEventListener('input',()=>out.textContent=fmt(+input.value));box.append(name,out,input);controls.append(box);return input;}
  const width=range('width','Ширина B, мм',155,255,195,10),profile=range('profile','Высота профиля, % от B',40,80,60,5),disk=range('disk','Диаметр диска, дюймы',13,19,15,1);
  const label=el('label','Показать размер','pd-control'),part=el('select');part.dataset.pdKey='part';part.setAttribute('aria-label','Показать размер');
  for(const [value,text]of [['width','Ширина B'],['side','Высота профиля H'],['disk','Диаметр диска d'],['all','Диаметр колеса D'],['radius','Радиус колеса']]){const o=el('option',text);o.value=value;part.append(o);}part.value=compare?'all':'width';label.append(part);controls.append(label);
  const rotation={};for(const key of ['yaw','pitch']){const input=el('input');input.type='hidden';input.value=presets.quarter[key];input.dataset.pdKey='tire-'+key;root.append(input);rotation[key]=input;}
  const buttons={};
  function action(parent,text,fn){const b=el('button',text,'pd-action');b.type='button';b.addEventListener('click',fn);parent.append(b);return b;}
  function view(){return {yaw:+rotation.yaw.value,pitch:+rotation.pitch.value};}
  function setView(yaw,pitch){rotation.yaw.value=((yaw+180)%360+360)%360-180;rotation.pitch.value=Math.max(-70,Math.min(70,pitch));rotation.yaw.dispatchEvent(new win.Event('input',{bubbles:true}));}
  for(const [key,text]of [['front','Со стороны диска'],['tread','Со стороны протектора'],['quarter','Объёмный вид']]){buttons[key]=action(views,text,()=>setView(presets[key].yaw,presets[key].pitch));buttons[key].dataset.tireView=key;buttons[key].setAttribute('aria-pressed',String(key==='quarter'));}
  const zoom=action(root,'Увеличить модель',()=>{const on=zoom.getAttribute('aria-pressed')!=='true';zoom.setAttribute('aria-pressed',String(on));zoom.textContent=on?'Уменьшить модель':'Увеличить модель';stage.classList.toggle('pd-picture-zoomed',on);});zoom.dataset.pdChoice='zoom';zoom.setAttribute('aria-pressed','false');
  const comparison=compare?el('p',null,'pd-note t3d-comparison'):null;if(comparison)root.append(comparison);
  function draw(){
   const dim=dimensions({B:+width.value,p:+profile.value,d:+disk.value}),camera=view(),m=measurement(dim,part.value),ends=m.line.map(v=>project(v,camera)),hidden=Math.hypot(ends[1][0]-ends[0][0],ends[1][1]-ends[0][1])<9;
   svg.innerHTML=renderSvg(dim,camera,part.value,id,compare);svg.setAttribute('aria-label',`Объёмная учебная модель ${fmt(dim.B)}/${fmt(dim.p)} R${fmt(dim.d)}. ${selectedText(dim,part.value)}`);
   marking.textContent=`${fmt(dim.B)}/${fmt(dim.p)} R${fmt(dim.d)}`;read.textContent=selectedText(dim,part.value);
   stage.dataset.yaw=camera.yaw;stage.dataset.pitch=camera.pitch;stage.dataset.selectedDimension=part.value;
   viewNote.textContent=hidden?'С этой стороны размер скрыт. Поверни колесо или выбери другой вид.':part.value==='width'?'Ширина идёт вдоль оси колеса. Протектор немного уже.':'Зелёный отрезок показывает выбранный размер.';if(hidden&&part.value==='width')viewNote.textContent='С этой стороны ширина скрыта. Поверни колесо или нажми «Со стороны протектора».';
   for(const key of Object.keys(buttons))buttons[key].setAttribute('aria-pressed',String(Math.abs(camera.yaw-presets[key].yaw)<.001&&Math.abs(camera.pitch-presets[key].pitch)<.001));
   if(comparison){const baseline=dimensions({B:dim.B,p:60,d:dim.d}),diff=dim.D-baseline.D;comparison.textContent=`Пунктир — профиль 60% при тех же B и d. Его диаметр ${fmt(baseline.D)} мм. ${diff===0?'Диаметры равны.':`Текущий диаметр ${diff>0?'больше':'меньше'} на ${fmt(Math.abs(diff))} мм; радиус — на ${fmt(Math.abs(diff)/2)} мм.`}`;}
  }
  [width,profile,disk,part,rotation.yaw,rotation.pitch].forEach(input=>input.addEventListener('input',draw));
  let drag=null;
  stage.addEventListener('pointerdown',event=>{if(event.button!==undefined&&event.button!==0)return;drag={id:event.pointerId,x:event.clientX,y:event.clientY,camera:view()};stage.setPointerCapture?.(event.pointerId);stage.classList.add('t3d-dragging');stage.focus({preventScroll:true});});
  stage.addEventListener('pointermove',event=>{if(!drag||event.pointerId!==drag.id)return;event.preventDefault();setView(drag.camera.yaw+(event.clientX-drag.x)*.55,drag.camera.pitch+(event.clientY-drag.y)*.45);});
  function end(event){if(!drag||event.pointerId!==drag.id)return;drag=null;stage.classList.remove('t3d-dragging');if(stage.hasPointerCapture?.(event.pointerId))stage.releasePointerCapture(event.pointerId);}
  stage.addEventListener('pointerup',end);stage.addEventListener('pointercancel',end);stage.addEventListener('lostpointercapture',end);
  stage.addEventListener('keydown',event=>{const camera=view(),keys={ArrowLeft:[-10,0],ArrowRight:[10,0],ArrowUp:[0,-8],ArrowDown:[0,8]};if(event.key==='Home'){event.preventDefault();setView(presets.quarter.yaw,presets.quarter.pitch);}else if(keys[event.key]){event.preventDefault();setView(camera.yaw+keys[event.key][0],camera.pitch+keys[event.key][1]);}});
  draw();return {root,stage,draw};
 }
 return {dimensions,buildMesh,rotate,project,measurement,renderSvg,selectedText,mount,presets,frame};
});
