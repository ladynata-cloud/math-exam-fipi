/* Fixed, original geometry diagrams for silent worked examples.
 * Only presentation progress changes. No learner state, network or audio. */
(function(root){'use strict';
 const NS='http://www.w3.org/2000/svg',ink='#214b5a',accent='#b44c24',green='#24775e';
 const clamp=x=>Math.max(0,Math.min(1,Number(x)||0)),ease=x=>{x=clamp(x);return x*x*(3-2*x);};
 function node(tag,attrs={},value){const e=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,String(v));if(value!==undefined)e.textContent=value;return e;}
 function mount(host,spec){
  const d=spec.diagram;if(!d||!d.points||!Array.isArray(d.segments))throw Error('Geometry core needs an authored diagram.');
  const svg=node('svg',{viewBox:'0 0 640 350',class:'motion-diagram geometry-core-motion',role:'img','aria-label':spec.caption||d.description||'Геометрический чертёж'}),animated=[],animatedLabels=[],spotlights=[];
  const point=id=>{const p=d.points[id];if(!p||![p.x,p.y].every(Number.isFinite))throw Error('Unknown geometry point '+id);return p;};
  const line=(a,b,attrs={},animate=false)=>{const e=node('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:ink,'stroke-width':3,'stroke-linecap':'round',...attrs});svg.append(e);if(animate)animated.push(e);return e;};
  const label=(x,y,value,attrs={},animate=false)=>{const e=node('text',{x,y,fill:ink,'font-family':'system-ui,sans-serif','font-size':22,'font-weight':650,'text-anchor':'middle',...attrs},value);svg.append(e);if(animate)animatedLabels.push(e);return e;};
  const active=id=>(spec.highlight||[]).includes(id),shown=id=>!id||(spec.built||[]).includes(id),intro=!!spec.intro;
  // A restrained halo makes the current pair visible without hiding the proof.
  for(const s of d.segments){if(!active(s.id)||!shown(s.construction))continue;const a=point(s.from),b=point(s.to);const halo=line(a,b,{stroke:accent,'stroke-width':16,'stroke-opacity':.08});spotlights.push(halo);}
  for(const s of d.segments){
   if(!shown(s.construction))continue;
   const a=point(s.from),b=point(s.to),selected=active(s.id),animate=intro||selected||!!s.construction;
   line(a,b,{stroke:s.dashed?'#82959b':ink,...s.dashed?{'stroke-dasharray':'6 5'}:{}},intro);
   if(selected||s.construction)line(a,b,{stroke:selected?accent:green,'stroke-width':4,...s.dashed?{'stroke-dasharray':'6 5'}:{}},animate);
   const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy),ux=dx/length,uy=dy/length;
   if(!(length>0))throw Error('Zero geometry segment.');
   for(let i=0;i<(s.marks||0);i++){const offset=(i-((s.marks||0)-1)/2)*7,c={x:(a.x+b.x)/2+ux*offset,y:(a.y+b.y)/2+uy*offset};line({x:c.x-uy*7,y:c.y+ux*7},{x:c.x+uy*7,y:c.y-ux*7},{stroke:green,'stroke-width':2.5},intro);}
   if(s.label)label((a.x+b.x)/2+(s.dx??-uy*19),(a.y+b.y)/2+(s.dy??ux*19),s.label,{},intro);
  }
  for(const a of d.angles||[]){
   if(!shown(a.construction))continue;
   const o=point(a.vertex),u=point(a.from),v=point(a.to),r=a.radius||35,A=Math.atan2(u.y-o.y,u.x-o.x),B=Math.atan2(v.y-o.y,v.x-o.x);let delta=(B-A+Math.PI*3)%(2*Math.PI)-Math.PI;
   if(Math.abs(delta)<1e-8)throw Error('Degenerate authored angle.');
   const selected=active(a.id),color=selected?accent:green,animate=intro||selected||!!a.construction;
   const at=(theta,rr)=>({x:o.x+Math.cos(theta)*rr,y:o.y+Math.sin(theta)*rr});
   if(a.right){
    if(Math.abs(Math.cos(delta))>1e-5)throw Error('A square may mark only an actual right angle.');
    const size=16,p=at(A,size),q=at(B,size),corner={x:p.x+q.x-o.x,y:p.y+q.y-o.y};line(p,corner,{stroke:color,'stroke-width':2.5},animate);line(corner,q,{stroke:color,'stroke-width':2.5},animate);
   }else{
    const p=at(A,r),q=at(A+delta,r),arc=node('path',{d:`M${p.x} ${p.y} A${r} ${r} 0 0 ${delta>0?1:0} ${q.x} ${q.y}`,fill:'none',stroke:color,'stroke-width':2.5});svg.append(arc);if(animate)animated.push(arc);
    for(let i=0;i<(a.marks||0);i++){const theta=A+delta/2+(i-((a.marks||0)-1)/2)*.12,p=at(theta,r-5),q=at(theta,r+5);line(p,q,{stroke:green,'stroke-width':2.5},animate);}
   }
   if(a.label){const p=at(A+delta/2,r+(a.labelOffset||27));label(p.x+(a.dx||0),p.y+(a.dy||0),a.label,{'font-size':20,fill:color},animate);}
  }
  if(d.protractor){
   const p=d.protractor,o=point(p.vertex),r=p.radius||177;
   for(let degree=0;degree<=180;degree+=10){const theta=-degree*Math.PI/180,a={x:o.x+Math.cos(theta)*(r-6),y:o.y+Math.sin(theta)*(r-6)},b={x:o.x+Math.cos(theta)*r,y:o.y+Math.sin(theta)*r};line(a,b,{stroke:'#9cacae','stroke-width':1.5},intro);if(degree%30===0||degree===p.mark){label(o.x+Math.cos(theta)*(r+17),o.y+Math.sin(theta)*(r+17)+5,p.zeroLeft?180-degree:degree,{'font-size':16,fill:'#50696f'},intro);}}
  }
  for(const[id,p]of Object.entries(d.points)){
   if(p.hidden||!shown(p.construction))continue;
   const e=node('circle',{cx:p.x,cy:p.y,r:4,fill:active(id)?accent:ink});svg.append(e);if(intro)animatedLabels.push(e);if(active(id)){const halo=node('circle',{cx:p.x,cy:p.y,r:13,fill:accent,'fill-opacity':.1});svg.append(halo);spotlights.push(halo);}
   if(p.label!==false)label(p.x+(p.dx||0),p.y+(p.dy??-13),p.label||id,{},intro);
  }
  for(const t of d.texts||[])label(t.x,t.y,t.text,{'font-size':t.size||20,'text-anchor':t.anchor||'middle'},intro);
  // Congruent figures move only after the authored proof scene has established
  // congruence. A reflected match depicts folding; no equality is inferred from it.
  let overlay=null,matchFrom=null,matchTo=null;
  if(spec.match){
   matchFrom=spec.match.from.map(point);matchTo=spec.match.to.map(point);
   if(matchFrom.length!==3||matchTo.length!==3)throw Error('A congruence overlay needs two triangles.');
   for(let i=0;i<3;i++)for(let j=i+1;j<3;j++){const a=Math.hypot(matchFrom[i].x-matchFrom[j].x,matchFrom[i].y-matchFrom[j].y),b=Math.hypot(matchTo[i].x-matchTo[j].x,matchTo[i].y-matchTo[j].y);if(Math.abs(a-b)>1e-5)throw Error('Overlay triangles must actually be congruent.');}
   overlay=node('polygon',{fill:'#6756a7','fill-opacity':.13,stroke:'#6756a7','stroke-width':3,'stroke-linejoin':'round'});svg.append(overlay);
  }
  const tracer=animated.length?node('circle',{r:4.5,fill:accent,'stroke':'#fff','stroke-width':2}):null;if(tracer)svg.append(tracer);
  host.append(svg);const caption=document.createElement('p');caption.className='motion-caption';caption.textContent=spec.caption||d.description||'';host.append(caption);
  return value=>{const p=clamp(value);animated.forEach((e,i)=>{const length=e.getTotalLength(),q=ease((p-(i%6)*.045)/.72);if(e.getAttribute('stroke-dasharray')){e.style.strokeDasharray='';e.style.strokeDashoffset='';e.style.opacity=String(q);}else{e.style.strokeDasharray=String(length);e.style.strokeDashoffset=String(length*(1-q));}});animatedLabels.forEach((e,i)=>{e.style.opacity=String(ease((p-.2-(i%5)*.045)/.48));});spotlights.forEach(e=>{e.style.opacity=String(.5+.5*ease(p));});if(tracer){const path=animated[animated.length-1],q=ease(p/.92),at=path.getPointAtLength(path.getTotalLength()*q);tracer.setAttribute('cx',at.x);tracer.setAttribute('cy',at.y);tracer.style.opacity=String(p>.92?(1-p)/.08:1);}if(overlay){const q=ease((p-.18)/.75);overlay.setAttribute('points',matchFrom.map((a,i)=>`${a.x+(matchTo[i].x-a.x)*q},${a.y+(matchTo[i].y-a.y)*q}`).join(' '));overlay.style.opacity=String(ease(p/.18));}svg.dataset.progress=String(p);};
 }
 root.MathExamGeometryCoreMotion=Object.freeze({mount});
})(typeof window==='undefined'?globalThis:window);
