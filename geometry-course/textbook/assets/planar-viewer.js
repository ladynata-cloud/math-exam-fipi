(function(global){'use strict';
const NS='http://www.w3.org/2000/svg';
const forbidden=new Set(['__proto__','prototype','constructor']);
const finite=Number.isFinite;
function validateModel(model){
 const errors=[],bad=s=>errors.push(s),points=model?.points||{},exists=p=>typeof p==='string'&&!forbidden.has(p)&&Object.hasOwn(points,p);
 if(!model||model.planar!==true||!Object.keys(points).length)return ['Missing planar model'];
 for(const [id,p] of Object.entries(points))if(forbidden.has(id)||!Array.isArray(p)||p.length!==3||!p.every(finite)||p[2]!==0)bad('Invalid planar point '+id);
 const pairs=list=>Array.isArray(list)&&list.every(pair=>Array.isArray(pair)&&pair.length===2&&pair.every(exists)&&pair[0]!==pair[1]);
 if(!Array.isArray(model.edges)||model.edges.length)bad('Planar scene must define its own edges');
 const bounds=model.bounds||[0,0,100,70];if(!Array.isArray(bounds)||bounds.length!==4||!bounds.every(finite)||bounds[2]<=bounds[0]+10||bounds[3]<=bounds[1]+10)bad('Invalid planar bounds');
 for(const [id,offset] of Object.entries(model.labelOffsets||{}))if(!exists(id)||!Array.isArray(offset)||offset.length!==2||!offset.every(finite))bad('Invalid label offset '+id);
 if(model.labelOnly&&(!Array.isArray(model.labelOnly)||!model.labelOnly.every(exists)))bad('Invalid label-only points');
 if(!model.views||!Object.hasOwn(model.views,'neutral'))bad('Missing neutral planar view');
 for(const [id,view] of Object.entries(model.views||{})){
  if(forbidden.has(id)||!view||typeof view.label!=='string'||!view.label.trim()){bad('Invalid planar view '+id);continue;}
  if(view.points&&(!Array.isArray(view.points)||!view.points.every(exists)))bad('Invalid visible planar points '+id);
  for(const key of ['segments','lines','rays','dashSegments','highlightSegments'])if(view[key]!==undefined&&!pairs(view[key]))bad('Invalid '+key+' '+id);
  if(view.availableFromStep!==undefined&&(!Number.isInteger(view.availableFromStep)||view.availableFromStep<0))bad('Invalid case unlock '+id);
  if(view.note!==undefined&&typeof view.note!=='string')bad('Invalid scene note '+id);
  if(view.polygons&&(!Array.isArray(view.polygons)||!view.polygons.every(a=>Array.isArray(a)&&a.length>=3&&a.every(exists))))bad('Invalid polygons '+id);
  for(const key of ['circles','rightAngles','angleArcs','equalSegments']){
   if(view[key]===undefined)continue;if(!Array.isArray(view[key])){bad('Invalid '+key+' '+id);continue;}
   for(const item of view[key]){
    const refs=key==='circles'?['center','through']:key==='rightAngles'?['vertex','a','b']:key==='angleArcs'?['vertex','from','to']:['a','b'];
    if(!item||refs.some(k=>!exists(item[k]))){bad('Invalid '+key+' point '+id);continue;}
    for(const k of ['size','radius'])if(item[k]!==undefined&&(!finite(item[k])||item[k]<=0))bad('Invalid marker size '+id);
    if(item.marks!==undefined&&(!Number.isInteger(item.marks)||item.marks<(key==='angleArcs'?0:1)||item.marks>3))bad('Invalid marker count '+id);
   }
  }
 }
 return errors;
}
function mount(root,model,options={}){
 const errors=validateModel(model);if(errors.length)throw Error(errors.join('; '));
 const doc=root.ownerDocument,win=doc.defaultView,bounds=model.bounds||[0,0,100,70],width=bounds[2]-bounds[0],height=bounds[3]-bounds[1],points=model.points;
 let destroyed=false,viewId='neutral',maxStep=Math.max(0,options.maxStep||0),zoom=1;
 const saved=options.savedCamera;
 if(saved&&finite(saved.zoom))zoom=Math.min(2.5,Math.max(1,saved.zoom));
 const stepNumber=id=>Number(String(id).match(/^step-(\d+)$/)?.[1]||0);
 const allowed=id=>Object.hasOwn(model.views,id)&&(id==='neutral'||stepNumber(id)>0?stepNumber(id)<=maxStep:(model.views[id].availableFromStep||0)<=maxStep);
 if(saved?.viewId&&allowed(saved.viewId))viewId=saved.viewId;
 function el(tag,text,attrs={}){const e=doc.createElement(tag);if(text!==undefined)e.textContent=text;for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);return e;}
 function svgEl(tag,attrs={}){const e=doc.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,String(v));return e;}
 const container=el('section',undefined,{class:'planar-viewer','aria-label':'Чертёж задачи'}),tools=el('div',undefined,{class:'planar-tools'}),viewport=el('div',undefined,{class:'planar-viewport',tabindex:'0','aria-label':'Чертёж. После увеличения его можно прокручивать.'}),svg=svgEl('svg',{viewBox:[bounds[0],-bounds[3],width,height].join(' '),role:'img','aria-label':model.description||'Чертёж условия','preserveAspectRatio':'xMidYMid meet'}),cases=el('div',undefined,{class:'planar-cases','aria-label':'Варианты чертежа'}),caption=el('p',undefined,{class:'planar-caption','aria-live':'polite'}),description=el('p',model.description||'',{class:'planar-description'});
 svg.classList.add('planar-svg');svg.style.aspectRatio=width+'/'+height;viewport.append(svg);
 const status=el('span','',{class:'planar-zoom','aria-live':'polite'});
 const reset=el('button','Условие',{type:'button'}),minus=el('button','−',{type:'button','aria-label':'Уменьшить чертёж'}),plus=el('button','+',{type:'button','aria-label':'Увеличить чертёж'}),expand=el('button','На весь экран',{type:'button'});
 tools.append(reset,minus,status,plus,expand);container.append(tools,viewport,cases,description,caption);root.replaceChildren(container);
 function state(){return {yaw:0,pitch:0,viewId,zoom,maxStep};}
 function changed(){options.onChange?.(state());}
 function point(name){const p=points[name];return [p[0],-p[1]];}
 function line(a,b,className='planar-edge'){const p=point(a),q=point(b);svg.append(svgEl('line',{x1:p[0],y1:p[1],x2:q[0],y2:q[1],class:className}));}
 function clipped(a,b,ray){
  const p=points[a],q=points[b],d=[q[0]-p[0],q[1]-p[1]],low=[bounds[0]+4,bounds[1]+4],high=[bounds[2]-4,bounds[3]-4];let enter=ray?0:-Infinity,leave=Infinity;
  for(let axis=0;axis<2;axis++){if(Math.abs(d[axis])<1e-10){if(p[axis]<low[axis]||p[axis]>high[axis])return null;continue;}let t0=(low[axis]-p[axis])/d[axis],t1=(high[axis]-p[axis])/d[axis];if(t0>t1)[t0,t1]=[t1,t0];enter=Math.max(enter,t0);leave=Math.min(leave,t1);}
  if(enter>leave||!finite(enter)||!finite(leave))return null;
  return [[p[0]+enter*d[0],-(p[1]+enter*d[1])],[p[0]+leave*d[0],-(p[1]+leave*d[1])]];
 }
 function vector(from,to){const a=points[from],b=points[to],d=[b[0]-a[0],b[1]-a[1]],length=Math.hypot(...d);return length?[d[0]/length,d[1]/length]:null;}
 // Labels alone may move to stay readable; all mathematical coordinates stay fixed.
 // Prefer the authored offset, then search a bounded, deterministic neighbourhood.
 function placeLabels(nodes,visible){
  if(!nodes.length||typeof nodes[0].getBBox!=='function')return;
  const edges=[];for(const edge of svg.querySelectorAll('line.planar-edge,polyline.planar-edge,line.planar-marker,polyline.planar-marker')){if(edge.tagName.toLowerCase()==='line')edges.push([[edge.x1.baseVal.value,edge.y1.baseVal.value],[edge.x2.baseVal.value,edge.y2.baseVal.value]]);else for(let i=1;i<edge.points.numberOfItems;i++){const a=edge.points.getItem(i-1),b=edge.points.getItem(i);edges.push([[a.x,a.y],[b.x,b.y]]);}}
  const circles=[...svg.querySelectorAll('circle.planar-edge')].map(c=>({x:c.cx.baseVal.value,y:c.cy.baseVal.value,r:c.r.baseVal.value}));
  const dots=visible.filter(id=>!model.labelOnly?.includes(id)).map(id=>({id,p:point(id)})),named=dots.filter(d=>!d.id.startsWith('_'));
  const centroid=named.length?named.reduce((sum,d)=>[sum[0]+d.p[0]/named.length,sum[1]+d.p[1]/named.length],[0,0]):[bounds[0]+width/2,-bounds[3]+height/2];
  const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  const ordered=dots.map(d=>d.p).sort((a,b)=>a[0]-b[0]||a[1]-b[1]),lower=[],upper=[];
  for(const p of ordered){while(lower.length>1&&cross(lower.at(-2),lower.at(-1),p)<=0)lower.pop();lower.push(p);}
  for(const p of [...ordered].reverse()){while(upper.length>1&&cross(upper.at(-2),upper.at(-1),p)<=0)upper.pop();upper.push(p);}
  const hull=lower.slice(0,-1).concat(upper.slice(0,-1));
  const insideHull=p=>hull.length>=3&&hull.every((a,i)=>cross(a,hull[(i+1)%hull.length],p)>=0);
  const expanded=(b,pad)=>({x:b.x-pad,y:b.y-pad,w:b.w+2*pad,h:b.h+2*pad});
  const overlap=(a,b,pad=.55)=>Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>-pad&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>-pad;
  function crosses(a,b,rect){let enter=0,leave=1;const lo=[rect.x,rect.y],hi=[rect.x+rect.w,rect.y+rect.h];for(let axis=0;axis<2;axis++){const delta=b[axis]-a[axis];if(Math.abs(delta)<1e-9){if(a[axis]<=lo[axis]||a[axis]>=hi[axis])return false;continue;}let p=(lo[axis]-a[axis])/delta,q=(hi[axis]-a[axis])/delta;if(p>q)[p,q]=[q,p];enter=Math.max(enter,p);leave=Math.min(leave,q);}return leave>enter;}
  function distance2(p,b){const dx=Math.max(b.x-p[0],0,p[0]-b.x-b.w),dy=Math.max(b.y-p[1],0,p[1]-b.y-b.h);return dx*dx+dy*dy;}
  const data=nodes.map(node=>{const id=node.dataset.point,p=point(id),box=node.getBBox(),x=Number(node.getAttribute('x')),y=Number(node.getAttribute('y')),anchor=node.getAttribute('text-anchor'),advance=node.getComputedTextLength?.()||box.width;
   return {node,id,p,preferred:[x-p[0],y-p[1]],left:box.x-x+(anchor==='end'?advance:anchor==='middle'?advance/2:0),top:box.y-y,w:box.width,h:box.height,advance,candidates:[]};
  });
  function candidate(item,dx,dy){const anchor=dx<-.1?'end':dx>.1?'start':'middle',x=item.p[0]+dx,y=item.p[1]+dy,b={x:x+item.left-(anchor==='end'?item.advance:anchor==='middle'?item.advance/2:0),y:y+item.top,w:item.w,h:item.h},center=[b.x+b.w/2,b.y+b.h/2],ownDistance=(center[0]-item.p[0])**2+(center[1]-item.p[1])**2;
   return {dx,dy,anchor,x,y,b,center,ownDistance,score:Math.hypot(dx-item.preferred[0],dy-item.preferred[1])+.12*Math.hypot(dx,dy)+(insideHull(center)?2.5:0)+((center[0]-item.p[0])*(item.p[0]-centroid[0])+(center[1]-item.p[1])*(item.p[1]-centroid[1])<0?1:0)};
  }
  function clear(item,c){const b=c.b;if(b.x<bounds[0]+.3||b.y<-bounds[3]+.3||b.x+b.w>bounds[2]-.3||b.y+b.h>-bounds[1]-.3)return false;
   if(edges.some(([a,z])=>crosses(a,z,expanded(b,.35))))return false;
   if(dots.some(d=>distance2(d.p,b)<1.1**2))return false;
   if(!model.labelOnly?.includes(item.id)&&named.some(d=>d.id!==item.id&&(c.center[0]-d.p[0])**2+(c.center[1]-d.p[1])**2<c.ownDistance-1e-7))return false;
   for(const circle of circles){const p=[circle.x,circle.y],near=Math.sqrt(distance2(p,expanded(b,.35))),far=Math.max(...[[b.x,b.y],[b.x+b.w,b.y],[b.x,b.y+b.h],[b.x+b.w,b.y+b.h]].map(q=>Math.hypot(q[0]-p[0],q[1]-p[1])));if(near<=circle.r&&far>=circle.r)return false;}
   return true;
  }
  for(const item of data){item.original=candidate(item,...item.preferred);const choices=[item.preferred];for(const radius of [3,4.5,6,7.5,9,10.5,12])for(let angle=0;angle<24;angle++){const theta=angle*Math.PI/12;choices.push([radius*Math.cos(theta),radius*Math.sin(theta)]);}const seen=new Set();for(const [dx,dy]of choices){const key=dx.toFixed(3)+','+dy.toFixed(3);if(seen.has(key))continue;seen.add(key);const c=candidate(item,dx,dy);if(clear(item,c))item.candidates.push(c);}item.candidates.sort((a,b)=>a.score-b.score||a.dx-b.dx||a.dy-b.dy);}
  const chosen=new Map(),locked=[];
  for(const item of data)if(clear(item,item.original)&&!data.some(other=>other!==item&&overlap(item.original.b,other.original.b))){chosen.set(item,item.original);locked.push(item.original.b);}
  const pending=data.filter(item=>!chosen.has(item)).sort((a,b)=>a.candidates.filter(c=>locked.every(b=>!overlap(c.b,b))).length-b.candidates.filter(c=>locked.every(b=>!overlap(c.b,b))).length||a.id.localeCompare(b.id));
  let attempts=0,best=new Map(chosen),deepest=0;
  function search(index,boxes){if(index>deepest){deepest=index;best=new Map(chosen);}if(index===pending.length)return true;if(attempts++>5000)return false;const item=pending[index];for(const c of item.candidates){if(boxes.some(b=>overlap(c.b,b)))continue;chosen.set(item,c);if(search(index+1,[...boxes,c.b]))return true;chosen.delete(item);}return false;}
  if(!search(0,locked)){chosen.clear();for(const [item,c]of best)chosen.set(item,c);}
  for(const item of data){const c=chosen.get(item)||item.original;item.node.setAttribute('x',c.x);item.node.setAttribute('y',c.y);item.node.setAttribute('text-anchor',c.anchor);item.node.dataset.labelPlacement=!chosen.has(item)?'unresolved':Math.abs(c.dx-item.preferred[0])+Math.abs(c.dy-item.preferred[1])<1e-6?'authored':'adjusted';item.node.dataset.offsetX=c.dx;item.node.dataset.offsetY=-c.dy;}
 }
 function draw(){
  if(destroyed)return;const v=model.views[viewId];svg.replaceChildren();svg.dataset.view=viewId;container.dataset.view=viewId;
  const title=svgEl('title');title.textContent=model.description||'Геометрический чертёж';svg.append(title);
  for(const polygon of v.polygons||[])svg.append(svgEl('polygon',{points:polygon.map(id=>point(id).join(',')).join(' '),class:'planar-polygon'}));
  for(const pair of v.lines||[]){const ends=clipped(...pair,false);if(ends)svg.append(svgEl('line',{x1:ends[0][0],y1:ends[0][1],x2:ends[1][0],y2:ends[1][1],class:'planar-edge'}));}
  for(const pair of v.rays||[]){const ends=clipped(...pair,true);if(ends)svg.append(svgEl('line',{x1:ends[0][0],y1:ends[0][1],x2:ends[1][0],y2:ends[1][1],class:'planar-edge'}));}
  for(const pair of v.segments||[])line(...pair);
  for(const pair of v.dashSegments||[])line(...pair,'planar-edge planar-dashed');
  for(const circle of v.circles||[]){const c=points[circle.center],p=points[circle.through];svg.append(svgEl('circle',{cx:c[0],cy:-c[1],r:Math.hypot(p[0]-c[0],p[1]-c[1]),class:'planar-edge'}));}
  for(const pair of v.highlightSegments||[])line(...pair,'planar-edge planar-highlight');
  for(const marker of v.rightAngles||[]){const c=points[marker.vertex],a=vector(marker.vertex,marker.a),b=vector(marker.vertex,marker.b),size=marker.size||3;if(!a||!b)continue;const coords=[[c[0]+size*a[0],-c[1]-size*a[1]],[c[0]+size*(a[0]+b[0]),-c[1]-size*(a[1]+b[1])],[c[0]+size*b[0],-c[1]-size*b[1]]];svg.append(svgEl('polyline',{points:coords.map(p=>p.join(',')).join(' '),class:'planar-marker'}));}
  for(const arc of v.angleArcs||[]){const c=points[arc.vertex],a=vector(arc.vertex,arc.from),b=vector(arc.vertex,arc.to);if(!a||!b)continue;const start=Math.atan2(a[1],a[0]);let delta=Math.atan2(a[0]*b[1]-a[1]*b[0],a[0]*b[0]+a[1]*b[1]);if(arc.reflex)delta=delta>0?delta-2*Math.PI:delta+2*Math.PI;
   const r=arc.radius||8,coords=Array.from({length:33},(_,j)=>{const angle=start+delta*j/32;return [c[0]+r*Math.cos(angle),-c[1]-r*Math.sin(angle)];});svg.append(svgEl('polyline',{points:coords.map(p=>p.join(',')).join(' '),class:'planar-marker'}));
   // A plain arc locates an angle. Explicit matching ticks denote equality.
   const count=arc.marks||0,spacing=Math.min(.14,Math.abs(delta)/(count+1)/2);
   for(let i=0;i<count;i++){const angle=start+delta/2+(i-(count-1)/2)*spacing,u=[Math.cos(angle),Math.sin(angle)];svg.append(svgEl('line',{x1:c[0]+(r-1.3)*u[0],y1:-c[1]-(r-1.3)*u[1],x2:c[0]+(r+1.3)*u[0],y2:-c[1]-(r+1.3)*u[1],class:'planar-marker'}));}
  }
  for(const mark of v.equalSegments||[]){const p=points[mark.a],q=points[mark.b],u=vector(mark.a,mark.b);if(!u)continue;const count=mark.marks||1;for(let i=0;i<count;i++){const shift=(i-(count-1)/2)*1.5,c=[(p[0]+q[0])/2+u[0]*shift,(p[1]+q[1])/2+u[1]*shift];svg.append(svgEl('line',{x1:c[0]-u[1]*1.4,y1:-c[1]-u[0]*1.4,x2:c[0]+u[1]*1.4,y2:-c[1]+u[0]*1.4,class:'planar-marker'}));}}
  const renderedWidth=svg.getBoundingClientRect().width||viewport.clientWidth||500,font=Math.min(8,Math.max(3.3,18*width/renderedWidth));
  const labelNodes=[];for(const id of v.points||[]){const p=point(id),offset=model.labelOffsets?.[id]||[2,3],name=model.labels?.[id]??id;if(!model.labelOnly?.includes(id))svg.append(svgEl('circle',{cx:p[0],cy:p[1],r:.65,class:'planar-point'}));
   if(id.startsWith('_'))continue;
   const label=svgEl('text',{x:p[0]+offset[0],y:p[1]-offset[1],'text-anchor':offset[0]<-.1?'end':offset[0]>.1?'start':'middle','dominant-baseline':'central','font-size':font,class:'planar-label','data-point':id});label.textContent=name;svg.append(label);labelNodes.push(label);
  }
  placeLabels(labelNodes,v.points||[]);
  caption.textContent=v.note||'';caption.hidden=!v.note;description.hidden=!model.description;
  cases.replaceChildren();const caseViews=Object.entries(model.views).filter(([id])=>/^case-/.test(id)&&allowed(id));
  for(const [id,vv]of caseViews){const button=el('button',vv.label,{type:'button','aria-pressed':String(viewId===id),'data-case':id});button.addEventListener('click',()=>setView(id));cases.append(button);}cases.hidden=!caseViews.length;
  status.textContent=Math.round(zoom*100)+'%';minus.disabled=zoom<=1;plus.disabled=zoom>=2.5;reset.setAttribute('aria-pressed',String(viewId==='neutral'));
 }
 function setView(id){if(destroyed||!Object.hasOwn(model.views,id))return false;const step=stepNumber(id);if(step)maxStep=Math.max(maxStep,step);if(!allowed(id))return false;viewId=id;draw();changed();return true;}
 function setZoom(value){zoom=Math.min(2.5,Math.max(1,value));svg.style.width=(zoom*100)+'%';draw();changed();}
 reset.addEventListener('click',()=>{zoom=1;svg.style.width='100%';viewport.scrollTo?.(0,0);setView('neutral');});minus.addEventListener('click',()=>setZoom(zoom-.25));plus.addEventListener('click',()=>setZoom(zoom+.25));
 expand.addEventListener('click',async()=>{try{if(doc.fullscreenElement===container){await doc.exitFullscreen();}else if(container.requestFullscreen){await container.requestFullscreen();}else{container.classList.toggle('planar-expanded');expand.textContent=container.classList.contains('planar-expanded')?'Закрыть большой чертёж':'На весь экран';draw();}}catch{container.classList.toggle('planar-expanded');expand.textContent=container.classList.contains('planar-expanded')?'Закрыть большой чертёж':'На весь экран';draw();}});
 function full(){expand.textContent=doc.fullscreenElement===container?'Выйти из полного экрана':'На весь экран';draw();}
 function key(event){if(event.key!=='Escape')return;if(container.classList.contains('planar-expanded')){event.preventDefault();event.stopPropagation();container.classList.remove('planar-expanded');expand.textContent='На весь экран';draw();expand.focus();}else if(doc.fullscreenElement===container){event.preventDefault();event.stopPropagation();doc.exitFullscreen?.().catch(()=>{});}}
 doc.addEventListener('fullscreenchange',full);doc.addEventListener('keydown',key,true);win.addEventListener('resize',draw);
 const observer=win.ResizeObserver?new win.ResizeObserver(draw):null;observer?.observe(viewport);
 svg.style.width=(zoom*100)+'%';draw();
 return {setView,getState:state,destroy(){destroyed=true;observer?.disconnect();win.removeEventListener('resize',draw);doc.removeEventListener('fullscreenchange',full);doc.removeEventListener('keydown',key,true);root.replaceChildren();}};
}
const api={mount,validateModel};global.PlanarViewer=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
