/* Source figures and learner-built graphs. No saved state or completion credit here. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('../peterson6/math.js'):root.PetersonMath);if(typeof module==='object'&&module.exports)module.exports=api;else root.MakarychevTaskGraphs=api;})(typeof globalThis!=='undefined'?globalThis:this,function(M){
'use strict';
function number(raw,limit=1000000){
 const s=String(raw).trim().replace(/−/g,'-').replace(/,/g,'.');
 // Share the checker's exact fraction parser so accepted mixed numbers also
 // produce points and curves. Keep the existing graph-only numeric syntax.
 const rational=M?.parse(s);
 if(rational){const v=rational.n/rational.d;return Math.abs(v)<=limit?v:null;}
 if(!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:\s*\/\s*[+-]?\d+(?:\.\d+)?)?$/.test(s))return null;
 const parts=s.split('/').map(Number),v=parts.length===2?parts[0]/parts[1]:parts[0];
 return Number.isFinite(v)&&Math.abs(v)<=limit?v:null;
}
function parse(value){
 const parts=String(value).split(';');if(parts.length<3||parts.length>12)return null;
 const k=number(parts[0]),b=number(parts[1]);
 const holes=parts.length===3&&parts[2].trim().toLowerCase()==='нет'?[]:parts.slice(2).map(v=>number(v));
 if(k===null||b===null||holes.some(x=>x===null)||new Set(holes).size!==holes.length)return null;
 return {k,b,holes};
}
function parseLine(value){const parts=String(value).split(';');if(parts.length!==2)return null;const [k,b]=parts.map(v=>number(v,1000000000000));return k===null||b===null?null:{k,b};}
function parsePair(value){
 const parts=String(value).split(';');if(parts.length!==4)return null;
 const values=parts.map(v=>number(v));if(values.some(v=>v===null))return null;
 return [{k:values[0],b:values[1],holes:[]},{k:values[2],b:values[3],holes:[]}];
}
function parseRootPoints(value,xs){
 const parts=String(value).split(';');if(!Array.isArray(xs)||xs.length<2||xs.length>12||parts.length!==xs.length)return null;
 const ys=parts.map(v=>number(v));if(ys.some(v=>v===null)||xs.some(x=>!Number.isFinite(x)))return null;
 return xs.map((x,i)=>[x,ys[i]]);
}
function curveValue(curve,x){
 if(curve.kind==='sqrt')return x>=0?Math.sqrt(x):NaN;
 if(curve.kind==='line')return curve.k*x+curve.b;
 if(curve.kind==='hyperbola')return x===0?NaN:curve.k/x;
 if(curve.kind==='square')return x*x;
 if(curve.kind==='sqrt-shift')return x>=curve.h?Math.sqrt(x-curve.h)+(curve.k||0):NaN;
 if(curve.kind==='sqrt-abs')return Math.sqrt(Math.abs(x));
 if(curve.kind==='abs-ratio')return x===0?NaN:(curve.scale??1)*Math.abs(x)/x;
 if(curve.kind==='x-abs')return (curve.scale??1)*x*Math.abs(x);
 return NaN;
}
function node(name,attrs,text){const el=document.createElementNS('http://www.w3.org/2000/svg',name);for(const [k,v]of Object.entries(attrs||{}))el.setAttribute(k,v);if(text!==undefined)el.textContent=text;return el;}
function graph(k,b,holes,range,label,otherLines=[]){
 const size=300,pad=24,scale=(size-2*pad)/(2*range),x=v=>150+scale*v,y=v=>150-scale*v;
 const svg=node('svg',{viewBox:'0 0 300 300',role:'img','aria-label':label});
 const line=(x1,y1,x2,y2,stroke,width=1)=>svg.append(node('line',{x1,y1,x2,y2,stroke,'stroke-width':width}));
 for(let v=-range;v<=range;v++){line(x(v),pad,x(v),size-pad,'#e1e7e2');line(pad,y(v),size-pad,y(v),'#e1e7e2');}
 line(pad,150,size-pad,150,'#567468',1.5);line(150,pad,150,size-pad,'#567468',1.5);
 const step=range>4?2:1;
 for(let v=-range+1;v<range;v++)if(v&&v%step===0){svg.append(node('text',{x:x(v),y:169,'text-anchor':'middle','font-size':16,fill:'#203b36'},v));svg.append(node('text',{x:139,y:y(v)+5,'text-anchor':'end','font-size':16,fill:'#203b36'},v));}
 svg.append(node('text',{x:282,y:145,'font-size':18},'x'),node('text',{x:158,y:22,'font-size':18},'y'),node('text',{x:157,y:169,'font-size':14},'0'));
 for(const [index,g]of [{k,b,holes},...otherLines].entries())if(g.k!==null){
  const {k,b,holes}=g,color=index?'#9b4d14':'#087c92';
  // Clip the mathematical line to the square without large coordinates or a shared SVG id.
  const points=[[-range,k*-range+b],[range,k*range+b]];
  if(k!==0)points.push([(-range-b)/k,-range],[(range-b)/k,range]);
  const inside=points.filter(([a,c])=>a>=-range-1e-9&&a<=range+1e-9&&c>=-range-1e-9&&c<=range+1e-9);
  if(inside.length>=2){const p=inside[0],q=inside.find(v=>Math.hypot(v[0]-p[0],v[1]-p[1])>1e-9);if(q){const l=node('line',{x1:x(p[0]),y1:y(p[1]),x2:x(q[0]),y2:y(q[1]),stroke:color,'stroke-width':3,'data-k':k,'data-b':b,'data-line-index':index});svg.append(l);}}
  for(const h of holes){const v=k*h+b;if(Math.abs(h)<=range&&Math.abs(v)<=range)svg.append(node('circle',{cx:x(h),cy:y(v),r:5,fill:'white',stroke:color,'stroke-width':2,'data-hole-x':h,'data-hole-y':v}));}
 }
 return svg;
}
const alternatives=[{k:-1,b:1,holes:[0]},{k:1,b:-1,holes:[]},{k:-1,b:1,holes:[1]},{k:1,b:-1,holes:[1]}];
function rootGraph(config,value){
 const xr=config.xRange||[-1,10],yr=config.yRange||[-1,6],width=360,height=260;
 const pad=Math.max(30,Math.max(...yr.map(v=>String(Math.round(v)).length))*10+6);
 if(xr.length!==2||yr.length!==2||![...xr,...yr].every(Number.isFinite)||xr[0]>=xr[1]||yr[0]>=yr[1])throw Error('Invalid root graph bounds');
 const x=v=>pad+(v-xr[0])/(xr[1]-xr[0])*(width-2*pad),y=v=>height-pad-(v-yr[0])/(yr[1]-yr[0])*(height-2*pad);
 const svg=node('svg',{viewBox:'0 0 '+width+' '+height,role:'img','aria-label':config.label||(['root-build','curve-build'].includes(config.type)?'Координатная плоскость для твоего построения':'Графики функций на координатной плоскости')});
 const line=(x1,y1,x2,y2,color,attrs={})=>svg.append(node('line',{x1,y1,x2,y2,stroke:color,'stroke-width':1,...attrs}));
 const step=(a,b)=>{const size=(b-a)/(Math.max(Math.abs(a),Math.abs(b))>=10000?3:6),p=Math.pow(10,Math.floor(Math.log10(size)));return [1,2,5,10].find(n=>n*p>=size)*p;};
 const label=v=>Math.abs(v)>=10000?Number(v.toPrecision(3)).toString():Number(v.toFixed(4)).toString();
 const sx=config.xTickStep||step(...xr),sy=config.yTickStep||step(...yr),gx=config.gridStep||(xr[1]-xr[0]<=24?Math.min(1,sx):sx),gy=config.gridStep||(yr[1]-yr[0]<=24?Math.min(1,sy):sy),hasXAxis=yr[0]<=0&&yr[1]>=0,hasYAxis=xr[0]<=0&&xr[1]>=0;
 if(![sx,sy,gx,gy].every(v=>Number.isFinite(v)&&v>0)||(xr[1]-xr[0])/gx>200||(yr[1]-yr[0])/gy>200)throw Error('Invalid root grid');
 for(let v=Math.ceil(xr[0]/gx)*gx;v<=xr[1]+gx/100;v+=gx)line(x(v),pad,x(v),height-pad,'#e1e7e2');
 for(let v=Math.ceil(yr[0]/gy)*gy;v<=yr[1]+gy/100;v+=gy)line(pad,y(v),width-pad,y(v),'#e1e7e2');
 for(let v=Math.ceil(xr[0]/sx)*sx;v<=xr[1]+sx/100;v+=sx){svg.append(node('text',{x:x(v),y:height-7,'text-anchor':'middle','font-size':18},label(v)));}
 for(let v=Math.ceil(yr[0]/sy)*sy;v<=yr[1]+sy/100;v+=sy){svg.append(node('text',{x:pad-5,y:y(v)+4,'text-anchor':'end','font-size':18},label(v)));}
 // A cropped view may omit zero. Its boundary is not a coordinate axis.
 if(hasXAxis){line(pad,y(0),width-pad,y(0),'#567468',{'data-axis':'x'});svg.append(node('text',{x:width-14,y:y(0)-6,'font-size':18,'data-axis-label':'x'},'x'));}
 if(hasYAxis){line(x(0),pad,x(0),height-pad,'#567468',{'data-axis':'y'});svg.append(node('text',{x:x(0)+6,y:18,'font-size':18,'data-axis-label':'y'},'y'));}
 const colors=['#087c92','#9b4d14','#7657ad'];
 const learner=['root-build','curve-build'].includes(config.type);
 const buildCurves=config.type==='curve-build'?(config.curves||[]):[{...(config.curve||{kind:'sqrt'}),xs:config.xs||[0,1,4,9]}];
 const definitions=buildCurves.flatMap(curve=>(curve.xs||[]).map(a=>({a,curve}))),xs=definitions.map(d=>d.a),points=learner?parseRootPoints(value,xs):null;
 // Construction begins with an empty coordinate plane. An exact curve is
 // shown only after the learner has supplied all correct defining points.
 const complete=points&&points.every(([a,b],i)=>Number.isFinite(curveValue(definitions[i].curve,a))&&b===curveValue(definitions[i].curve,a));
 const curves=learner?(complete?buildCurves:[]):(config.curves||[{kind:'sqrt'}]);
 curves.forEach((c,j)=>{
  let path='',open=false,previous=null;
  const samples=Array.from({length:601},(_,i)=>xr[0]+(xr[1]-xr[0])*i/600);
  if(xr[0]<=0&&xr[1]>=0)samples.push(0);
  if(c.kind==='sqrt-shift'&&c.h>=xr[0]&&c.h<=xr[1])samples.push(c.h);
  for(const a of c.xs||[])if(a>=xr[0]&&a<=xr[1])samples.push(a);
  samples.sort((a,b)=>a-b);
  for(const a of samples){
   const b=curveValue(c,a);
   const inside=Number.isFinite(b)&&b>=yr[0]&&b<=yr[1];
   const continuous=previous&&!(c.kind==='hyperbola'&&previous[0]*a<=0)&&Math.abs(y(b)-y(previous[1]))<height/2;
   if(inside){path+=(open&&continuous?'L':'M')+x(a).toFixed(3)+' '+y(b).toFixed(3)+' ';open=true;}else open=false;
   previous=[a,b];
  }
  svg.append(node('path',{d:path,fill:'none',stroke:colors[j%colors.length],'stroke-width':2.5,'data-root-curve':c.kind,'data-curve-k':c.k??'','data-curve-b':c.b??'','data-curve-h':c.h??'','data-curve-scale':c.scale??''}));
  if(c.kind==='abs-ratio'&&xr[0]<=0&&xr[1]>=0)for(const b of [-(c.scale??1),c.scale??1])if(b>=yr[0]&&b<=yr[1])svg.append(node('circle',{cx:x(0),cy:y(b),r:4,fill:'white',stroke:colors[j%colors.length],'stroke-width':2,'data-hole-x':0,'data-hole-y':b}));
  if(c.label){
   const at=c.labelAt||[xr[1]-(xr[1]-xr[0])/8,curveValue(c,xr[1]-(xr[1]-xr[0])/8)];
   if(at.every(Number.isFinite)){
    // Face labels toward the plot interior. One em per character is a
    // conservative bound for the supplied formulas, including detached SVGs.
    const length=Math.max(1,Array.from(String(c.label)).length),fontSize=Math.min(20,(width-2*pad-16)/length),labelWidth=length*fontSize,left=pad+8,right=width-pad-8,end=x(at[0])>=width/2;
    const labelX=end?Math.max(left+labelWidth,Math.min(right,x(at[0]))):Math.max(left,Math.min(right-labelWidth,x(at[0])));
    svg.append(node('text',{x:labelX,y:Math.max(pad+fontSize,Math.min(height-pad-5,y(at[1]))),'text-anchor':end?'end':'start','font-size':fontSize,fill:colors[j%colors.length],'data-curve-label':c.label},c.label));
   }
  }
 });
 for(const [a,b,labelText]of [...(points||[]),...(config.points||[])]){
  if(!Number.isFinite(a)||!Number.isFinite(b)||a<xr[0]||a>xr[1]||b<yr[0]||b>yr[1])continue;
  svg.append(node('circle',{cx:x(a),cy:y(b),r:4,fill:'#166753','data-point-x':a,'data-point-y':b}));
  if(labelText)svg.append(node('text',{x:x(a)+6,y:y(b)-7,'font-size':18},labelText));
 }
 return svg;
}
function numberLine(config){
 const [min,max]=config.range||[0,4],major=config.major||1,minor=config.minor||major,width=360,pad=30,axis=76;
 if(![min,max,major,minor].every(Number.isFinite)||min>=max||major<=0||minor<=0||(max-min)/minor>200)throw Error('Invalid number line');
 const x=v=>pad+(v-min)/(max-min)*(width-2*pad),svg=node('svg',{viewBox:'0 0 360 138',role:'img','aria-label':config.label||'Координатная прямая с отмеченными точками'});
 for(let v=Math.ceil(min/minor)*minor;v<=max+minor/100;v+=minor)svg.append(node('line',{x1:x(v),x2:x(v),y1:18,y2:104,stroke:'#e1e7e2','stroke-width':1}));
 for(let y=18;y<=104;y+=17.2)svg.append(node('line',{x1:pad,x2:width-pad,y1:y,y2:y,stroke:'#e1e7e2','stroke-width':1}));
 svg.append(node('line',{x1:pad,x2:width-pad,y1:axis,y2:axis,stroke:'#203b36','stroke-width':1.5}),node('path',{d:'M326 72 L333 76 L326 80 Z',fill:'#203b36'}));
 const labels=config.labels||Array.from({length:Math.floor((max-min)/major)+1},(_,i)=>Math.ceil(min/major)*major+i*major).filter(v=>v<=max);
 for(const v of labels)svg.append(node('line',{x1:x(v),x2:x(v),y1:axis-4,y2:axis+4,stroke:'#203b36','stroke-width':1.5}),node('text',{x:x(v),y:axis+23,'text-anchor':'middle','font-size':18},v));
 for(const point of config.points||[])if(point.x>=min&&point.x<=max)svg.append(node('line',{x1:x(point.x),x2:x(point.x),y1:axis-5,y2:axis+5,stroke:'#087c92','stroke-width':2,'data-number-point':point.label,'data-number-x':point.x}),node('text',{x:x(point.x),y:axis-12,'text-anchor':'middle','font-size':20},point.label));
 return svg;
}
function render(host,config,value){
 if(!host||!config)return;host.replaceChildren();
 if(config.type==='number-line'){host.className='task-graphs number-line';host.append(numberLine(config));if(config.caption){const caption=document.createElement('p');caption.className='small';caption.textContent=config.caption;host.append(caption);}
 }else if(config.type==='root-line'){
  host.className='task-graphs root-graph';const line=parseLine(value),plane={...config,type:'root-plane',curves:[{kind:'sqrt'},...(line?[{kind:'line',...line}]:[])]};host.append(rootGraph(plane,''));
  const caption=document.createElement('p');caption.className='small';caption.textContent='Показана часть графиков. Введи k; b, чтобы добавить свою прямую y=kx+b. Число пересечений проверяется по уравнению.';host.append(caption);
 }else if(['root-plane','root-build','curve-build'].includes(config.type)){
  host.className='task-graphs root-graph';host.append(rootGraph(config,value));
  const caption=document.createElement('p');caption.className='small';
  caption.textContent=['root-build','curve-build'].includes(config.type)?'Введи ординаты точек ниже — они появятся на твоём чертеже.':(config.caption||'На рисунке показана часть графика. Проверяй выводы по формуле.');host.append(caption);
 }else if(config.type==='choices'){
  host.className='task-graphs alternatives';
  alternatives.forEach((g,i)=>{
   const fig=document.createElement('figure'),caption=document.createElement('figcaption'),zoom=document.createElement('button');zoom.type='button';zoom.className='graph-zoom';zoom.textContent='График '+(i+1)+' ↗';zoom.setAttribute('aria-label','Увеличить график '+(i+1));caption.append(zoom);
   const label='График '+(i+1)+': y='+g.k+'x'+(g.b<0?'':'+')+g.b+(g.holes.length?', выколотая точка при x='+g.holes[0]:', без выколотых точек');
   fig.append(caption,graph(g.k,g.b,g.holes,3,label));host.append(fig);
   zoom.onclick=()=>{const dialog=document.createElement('dialog'),title=document.createElement('p'),close=document.createElement('button');dialog.className='graph-dialog';dialog.setAttribute('aria-label','Увеличенный график '+(i+1));title.textContent='График '+(i+1);close.type='button';close.textContent='Вернуться к выбору';dialog.append(title,graph(g.k,g.b,g.holes,3,label),close);host.append(dialog);close.onclick=()=>dialog.close();dialog.addEventListener('close',()=>{dialog.remove();zoom.focus();},{once:true});dialog.showModal();};
  });
 }else if(config.type==='pair'||config.type==='pair-reference'){
  host.className='task-graphs construction';
  const pair=parsePair(config.type==='pair-reference'?(config.lines||[]).flat().join(';'):value),caption=document.createElement('p');caption.className='small';
  caption.textContent=config.type==='pair-reference'?'Сравни с точным решением.':pair?'Чертёж по твоей записи.':'Введи коэффициенты ниже.';
  const label=pair?'Две прямые: '+pair.map(g=>'y='+g.k+'x'+(g.b<0?'':'+')+g.b).join('; '):'Координатные оси для построения двух прямых';
  host.append(graph(pair?pair[0].k:null,pair?pair[0].b:0,[],config.range||4,label,pair?[pair[1]]:[]),caption);
 }else{
  host.className='task-graphs construction';const g=parse(value),caption=document.createElement('p');caption.className='small';caption.textContent=g?'Твой график по введённой записи. Проверь его кнопкой ниже.':'Твой чертёж появится после ввода k; b; исключённых x в поле ответа.';
  host.append(graph(g?g.k:null,g?g.b:0,g?g.holes:[],config.range||7,'Твой график'+(g?': y='+g.k+'x'+(g.b<0?'':'+')+g.b+'; исключённые x: '+(g.holes.join(', ')||'нет'):': координатные оси')),caption);
 }
}
return {parse,parsePair,parseLine,parseRootPoints,curveValue,alternatives,render,rootGraph,numberLine};
});
