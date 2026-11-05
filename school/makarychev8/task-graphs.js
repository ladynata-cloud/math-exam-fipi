/* Source figure 2 and learner-built lines. No answer evaluation or stored state here. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MakarychevTaskGraphs=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function number(raw){
 const s=String(raw).trim().replace(/−/g,'-').replace(/,/g,'.');
 if(!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:\s*\/\s*[+-]?\d+(?:\.\d+)?)?$/.test(s))return null;
 const parts=s.split('/').map(Number),v=parts.length===2?parts[0]/parts[1]:parts[0];
 return Number.isFinite(v)&&Math.abs(v)<=1000000?v:null;
}
function parse(value){
 const parts=String(value).split(';');if(parts.length<3||parts.length>12)return null;
 const k=number(parts[0]),b=number(parts[1]);
 const holes=parts.length===3&&parts[2].trim().toLowerCase()==='нет'?[]:parts.slice(2).map(number);
 if(k===null||b===null||holes.some(x=>x===null)||new Set(holes).size!==holes.length)return null;
 return {k,b,holes};
}
function node(name,attrs,text){const el=document.createElementNS('http://www.w3.org/2000/svg',name);for(const [k,v]of Object.entries(attrs||{}))el.setAttribute(k,v);if(text!==undefined)el.textContent=text;return el;}
function graph(k,b,holes,range,label){
 const size=300,pad=24,scale=(size-2*pad)/(2*range),x=v=>150+scale*v,y=v=>150-scale*v;
 const svg=node('svg',{viewBox:'0 0 300 300',role:'img','aria-label':label});
 const line=(x1,y1,x2,y2,stroke,width=1)=>svg.append(node('line',{x1,y1,x2,y2,stroke,'stroke-width':width}));
 for(let v=-range;v<=range;v++){line(x(v),pad,x(v),size-pad,'#e1e7e2');line(pad,y(v),size-pad,y(v),'#e1e7e2');}
 line(pad,150,size-pad,150,'#567468',1.5);line(150,pad,150,size-pad,'#567468',1.5);
 const step=range>4?2:1;
 for(let v=-range+1;v<range;v++)if(v&&v%step===0){svg.append(node('text',{x:x(v),y:169,'text-anchor':'middle','font-size':16,fill:'#203b36'},v));svg.append(node('text',{x:139,y:y(v)+5,'text-anchor':'end','font-size':16,fill:'#203b36'},v));}
 svg.append(node('text',{x:282,y:145,'font-size':18},'x'),node('text',{x:158,y:22,'font-size':18},'y'),node('text',{x:157,y:169,'font-size':14},'0'));
 if(k!==null){
  // Clip the mathematical line to the square without large coordinates or a shared SVG id.
  const points=[[-range,k*-range+b],[range,k*range+b]];
  if(k!==0)points.push([(-range-b)/k,-range],[(range-b)/k,range]);
  const inside=points.filter(([a,c])=>a>=-range-1e-9&&a<=range+1e-9&&c>=-range-1e-9&&c<=range+1e-9);
  if(inside.length>=2){const p=inside[0],q=inside.find(v=>Math.hypot(v[0]-p[0],v[1]-p[1])>1e-9);if(q){const l=node('line',{x1:x(p[0]),y1:y(p[1]),x2:x(q[0]),y2:y(q[1]),stroke:'#087c92','stroke-width':3,'data-k':k,'data-b':b});svg.append(l);}}
  for(const h of holes){const v=k*h+b;if(Math.abs(h)<=range&&Math.abs(v)<=range)svg.append(node('circle',{cx:x(h),cy:y(v),r:5,fill:'white',stroke:'#087c92','stroke-width':2,'data-hole-x':h,'data-hole-y':v}));}
 }
 return svg;
}
const alternatives=[{k:-1,b:1,holes:[0]},{k:1,b:-1,holes:[]},{k:-1,b:1,holes:[1]},{k:1,b:-1,holes:[1]}];
function render(host,config,value){
 if(!host||!config)return;host.replaceChildren();
 if(config.type==='choices'){
  host.className='task-graphs alternatives';
  alternatives.forEach((g,i)=>{const fig=document.createElement('figure'),caption=document.createElement('figcaption');caption.textContent='График '+(i+1);fig.append(caption,graph(g.k,g.b,g.holes,3,'График '+(i+1)+': y='+g.k+'x'+(g.b<0?'':'+')+g.b+(g.holes.length?', выколотая точка при x='+g.holes[0]:', без выколотых точек')));host.append(fig);});
 }else{
  host.className='task-graphs construction';const g=parse(value),caption=document.createElement('p');caption.className='small';caption.textContent=g?'Твой график по введённой записи. Проверь его кнопкой ниже.':'Твой чертёж появится после ввода k; b; исключённых x в поле ответа.';
  host.append(graph(g?g.k:null,g?g.b:0,g?g.holes:[],config.range||7,'Твой график'+(g?': y='+g.k+'x'+(g.b<0?'':'+')+g.b+'; исключённые x: '+(g.holes.join(', ')||'нет'):': координатные оси')),caption);
 }
}
return {parse,alternatives,render};
});
