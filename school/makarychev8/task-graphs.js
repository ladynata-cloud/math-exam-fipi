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
 if(curve.domain&&(x<curve.domain[0]||x>curve.domain[1]))return NaN;
 if((curve.holes||[]).some(([h])=>x===h))return NaN;
 if(curve.kind==='quotient'){
  const polynomial=coeff=>coeff.reduceRight((sum,c)=>sum*x+c,0);
  const bottom=polynomial(curve.denominator);return bottom===0?NaN:polynomial(curve.numerator)/bottom;
 }
 if(curve.kind==='reciprocal-offset')return x===0?NaN:curve.b+curve.k/x;
 if(curve.kind==='absolute-reciprocal')return x===0?NaN:curve.k/Math.abs(x);
 if(curve.kind==='sign-linear')return x===curve.h?NaN:Math.sign(x-curve.h)*(curve.k*x+curve.b);
 if(curve.kind==='abs-linear')return curve.k*Math.abs(x)+curve.b;
 if(curve.kind==='behavior-function')return behaviorHeight(curve.mode,x);
 if(curve.kind==='behavior-linear-points'){
  const n=curve.nodes,i=n.findIndex(p=>p[0]>=x);if(i<0||x<n[0][0])return NaN;if(i===0)return n[0][1];const [a,lo]=n[i-1],[b,hi]=n[i];return lo+(hi-lo)*(x-a)/(b-a);
 }
 if(curve.kind==='feature-curve'){if(curve.segment&&(x<curve.segment[0]||x>curve.segment[1]))return NaN;return featureY(curve.shape,curve.k,curve.b,x);}
 if(curve.kind==='reading-profile')return readingHeight(curve.nodes,x);
 if(curve.kind==='source-absolute-domain'){
  if(curve.mode==='abs-positive')return 5/(Math.abs(x+1)+4);
  if(curve.mode==='abs-den')return Math.abs(x)===2?NaN:48/(Math.abs(x)-2);
  return curve.mode==='abs-rad'?x*x+Math.sqrt(Math.abs(x)-1):Math.sqrt(Math.abs(2-x)-3*x);
 }
 if(curve.kind==='sqrt-affine'){const radicand=curve.k*x+curve.b;return radicand>=0?Math.sqrt(radicand):NaN;}
 if(curve.kind==='sqrt')return x>=0?Math.sqrt(x):NaN;
 if(curve.kind==='line')return curve.k*x+curve.b;
 if(curve.kind==='hyperbola')return x===0?NaN:curve.k/x;
 if(curve.kind==='quadratic')return curve.a*x*x+curve.b*x+curve.c;
 if(curve.kind==='square')return x*x;
 if(curve.kind==='cube')return (curve.scale??1)*x*x*x;
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
 const pad=config.compactTicks?56:Math.max(30,Math.max(...yr.map(v=>String(Math.round(v)).length))*10+6);
 if(xr.length!==2||yr.length!==2||![...xr,...yr].every(Number.isFinite)||xr[0]>=xr[1]||yr[0]>=yr[1])throw Error('Invalid root graph bounds');
 const x=v=>pad+(v-xr[0])/(xr[1]-xr[0])*(width-2*pad),y=v=>height-pad-(v-yr[0])/(yr[1]-yr[0])*(height-2*pad);
 const svg=node('svg',{viewBox:'0 0 '+width+' '+height,role:'img','aria-label':config.label||(['root-build','curve-build'].includes(config.type)?'Координатная плоскость для твоего построения':'Графики функций на координатной плоскости')});
 const line=(x1,y1,x2,y2,color,attrs={})=>svg.append(node('line',{x1,y1,x2,y2,stroke:color,'stroke-width':1,...attrs}));
 const step=(a,b)=>{const size=(b-a)/(Math.max(Math.abs(a),Math.abs(b))>=10000?3:6),p=Math.pow(10,Math.floor(Math.log10(size)));return [1,2,5,10].find(n=>n*p>=size)*p;};
 const label=v=>config.compactTicks&&Math.abs(v)>=10000?v.toExponential(0):Math.abs(v)>=10000?Number(v.toPrecision(3)).toString():Number(v.toFixed(4)).toString();
 const sx=config.xTickStep||step(...xr),sy=config.yTickStep||step(...yr),gx=config.gridStep||(xr[1]-xr[0]<=24?Math.min(1,sx):sx),gy=config.gridStep||(yr[1]-yr[0]<=24?Math.min(1,sy):sy),hasXAxis=yr[0]<=0&&yr[1]>=0,hasYAxis=xr[0]<=0&&xr[1]>=0;
 if(![sx,sy,gx,gy].every(v=>Number.isFinite(v)&&v>0)||(xr[1]-xr[0])/gx>200||(yr[1]-yr[0])/gy>200)throw Error('Invalid root grid');
 for(let v=Math.ceil(xr[0]/gx)*gx;v<=xr[1]+gx/100;v+=gx)line(x(v),pad,x(v),height-pad,'#e1e7e2');
 for(let v=Math.ceil(yr[0]/gy)*gy;v<=yr[1]+gy/100;v+=gy)line(pad,y(v),width-pad,y(v),'#e1e7e2');
 for(let v=Math.ceil(xr[0]/sx)*sx;v<=xr[1]+sx/100;v+=sx){svg.append(node('text',{x:x(v),y:height-7,'text-anchor':'middle','font-size':18},label(v)));}
 for(let v=Math.ceil(yr[0]/sy)*sy;v<=yr[1]+sy/100;v+=sy){svg.append(node('text',{x:pad-5,y:y(v)+4,'text-anchor':'end','font-size':18},label(v)));}
 // A cropped view may omit zero. Its boundary is not a coordinate axis.
 if(hasXAxis){line(pad,y(0),width-pad,y(0),'#567468',{'data-axis':'x'});svg.append(node('text',{x:config.axisLabels?width-6:width-14,...(config.axisLabels?{'text-anchor':'end'}:{}),y:y(0)-6,'font-size':18,'data-axis-label':'x'},config.axisLabels?.[0]||'x'));}
 if(hasYAxis){line(x(0),pad,x(0),height-pad,'#567468',{'data-axis':'y'});svg.append(node('text',{x:x(0)+6,y:18,'font-size':18,'data-axis-label':'y'},config.axisLabels?.[1]||'y'));}
 const colors=['#087c92','#9b4d14','#7657ad'];
 const learner=['root-build','curve-build'].includes(config.type);
 const buildCurves=config.type==='curve-build'?(config.curves||[]):[{...(config.curve||{kind:'sqrt'}),xs:config.xs||[0,1,4,9]}];
 const definitions=buildCurves.flatMap(curve=>(curve.xs||[]).map(a=>({a,curve}))),xs=definitions.map(d=>d.a),points=learner?parseRootPoints(value,xs):null;
 // Construction begins with an empty coordinate plane. An exact curve is
 // shown only after the learner has supplied all correct defining points.
 const complete=config.showSolution!==false&&points&&points.every(([a,b],i)=>Number.isFinite(curveValue(definitions[i].curve,a))&&b===curveValue(definitions[i].curve,a));
 const curves=learner?(complete?buildCurves:[]):(config.curves||[{kind:'sqrt'}]);
 curves.forEach((c,j)=>{
  let path='',open=false,previous=null;
  const breaks=[...(c.holes||[]).map(([h])=>h),...(c.poles||[])];
  if(['hyperbola','reciprocal-offset','absolute-reciprocal'].includes(c.kind))breaks.push(0);
  if(c.kind==='sign-linear')breaks.push(c.h);
  const samples=Array.from({length:601},(_,i)=>xr[0]+(xr[1]-xr[0])*i/600);
  for(const cut of breaks)if(cut>=xr[0]&&cut<=xr[1])samples.push(cut);
  if(xr[0]<=0&&xr[1]>=0)samples.push(0);
  if(c.kind==='sqrt-shift'&&c.h>=xr[0]&&c.h<=xr[1])samples.push(c.h);
  for(const a of c.xs||[])if(a>=xr[0]&&a<=xr[1])samples.push(a);
  samples.sort((a,b)=>a-b);
  for(const a of samples){
   const b=curveValue(c,a);
   const inside=Number.isFinite(b)&&b>=yr[0]&&b<=yr[1];
   const continuous=previous&&!breaks.some(h=>previous[0]<=h&&h<=a)&&Math.abs(y(b)-y(previous[1]))<height/2;
   if(inside){path+=(open&&continuous?'L':'M')+x(a).toFixed(3)+' '+y(b).toFixed(3)+' ';open=true;}else open=false;
   previous=[a,b];
  }
  if(c.kind==='vertical'&&c.h>=xr[0]&&c.h<=xr[1])path='M'+x(c.h)+' '+pad+' L'+x(c.h)+' '+(height-pad);
  svg.append(node('path',{d:path,fill:'none',stroke:colors[j%colors.length],'stroke-width':2.5,...(c.dashed?{'stroke-dasharray':c.dashPattern||'7 4'}:{}),'data-root-curve':c.kind,'data-curve-k':c.k??'','data-curve-b':c.b??'','data-curve-h':c.h??'','data-curve-scale':c.scale??''}));
  for(const [h,v] of c.holes||[])if(h>=xr[0]&&h<=xr[1]&&v>=yr[0]&&v<=yr[1])svg.append(node('circle',{cx:x(h),cy:y(v),r:5,fill:'white',stroke:colors[j%colors.length],'stroke-width':2,'data-hole-x':h,'data-hole-y':v}));
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
 if(config.studentPoint){
  const [a,b]=config.studentPoint;
  if(a>=xr[0]&&a<=xr[1]&&b>=yr[0]&&b<=yr[1])svg.append(node('rect',{x:x(a)-4,y:y(b)-4,width:8,height:8,fill:'#8e451d','data-function-estimate':a+';'+b}));
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
function parseIntegerPairs(value){
 const text=String(value).trim().replace(/−/g,'-');
 if(!text || text.length>1000)return null;
 const pattern=/\(\s*([+-]?\d{1,8})\s*;\s*([+-]?\d{1,8})\s*\)/y;
 const pairs=[];
 let position=0;
 while(position<text.length){
  pattern.lastIndex=position;
  const match=pattern.exec(text);
  if(!match)return null;
  pairs.push([Number(match[1]),Number(match[2])]);
  position=pattern.lastIndex;
  if(position===text.length)break;
  const separator=/^\s*[,;]\s*/.exec(text.slice(position));
  if(!separator)return null;
  position+=separator[0].length;
  if(position===text.length)return null;
 }
 return pairs;
}

function pairEquation(rule, pair){
 const [x,y]=pair.map(BigInt);
 switch(rule){
  case '206-a':return {left:5n*x+y-x*y,right:2n};
  case '206-b':return {left:x*y-x+y,right:8n};
  case '207-all':return {left:(x-3n)*y,right:x*x-6n*x+1n,allowed:x!==3n};
  case '209-all':return {left:7n*(x+y),right:x*y,allowed:x>0n&&y>0n};
 }
 throw Error('Unknown pair equation');
}

function renderIntegerPairs(host,config,value){
 host.className='task-graphs pair-check';
 const title=document.createElement('p');
 title.textContent='Подстановка твоих пар в равенство';
 host.append(title);
 const pairs=parseIntegerPairs(value);
 if(!pairs){
  const guide=document.createElement('p');
  guide.className='small';
  guide.textContent='Введи пару в скобках, например (2;3), и нажми «Проверить». Здесь появятся значения левой и правой частей.';
  host.append(guide);
  return;
 }
 const formulas={'206-a':'5x + y − xy = 2','206-b':'xy − x + y = 8',
                 '207-all':'(x − 3)y = x² − 6x + 1','209-all':'7(a + b) = ab'};
 title.textContent+=' '+formulas[config.rule];
 const list=document.createElement('ul');
 for(const pair of pairs){
  const result=pairEquation(config.rule,pair),row=document.createElement('li');
  const status=result.allowed===false?'проверь область допустимых значений':result.left===result.right?'равенство верно':'значения различаются';
  row.textContent='('+pair.join('; ')+'). '+'Слева '+result.left+', справа '+result.right+' — '+status+'.';
  list.append(row);
 }
 host.append(list);
}

function renderTrainMeeting(host,value){
 host.className='task-graphs train-model';
 const speeds=String(value||'').split(';');
 for(const [index,time] of [7,6].entries()){
  const figure=document.createElement('figure'),caption=document.createElement('figcaption');
  const speed=number(speeds[index]||''),first=60*time;
  const second=speed!==null&&speed>=0?speed*(time-3):null;
  caption.textContent='До встречи '+time+' ч. Первый поезд в пути '+time+' ч, второй — '+(time-3)+' ч.';
  const svg=node('svg',{viewBox:'0 0 300 62',role:'img','aria-label':'Путь от А до Б, 600 км'});
  svg.append(node('line',{x1:16,y1:26,x2:284,y2:26,stroke:'#57656e','stroke-width':2}));
  svg.append(node('text',{x:16,y:12,'text-anchor':'middle'},'А'),node('text',{x:284,y:12,'text-anchor':'middle'},'Б'));
  if(second!==null){
   const scale=268/600,bound=16+scale*first,end=284-Math.min(600,second)*scale;
   svg.append(node('line',{x1:16,y1:23,x2:bound,y2:23,stroke:'#206946','stroke-width':6}),
              node('circle',{cx:bound,cy:23,r:4,fill:'#206946'}),
              node('line',{x1:284,y1:30,x2:end,y2:30,stroke:'#9a422d','stroke-width':6}),
              node('path',{d:'M '+end+' 25 l -5 5 l 5 5 z',fill:'#9a422d'}));
   const total=first+second;
   const distance=n=>n.toLocaleString('ru',{maximumFractionDigits:2});
   caption.textContent+=' Из А '+first+' км, из Б '+distance(second)+' км. Вместе '+distance(total)+' км.';
   svg.setAttribute('aria-label',caption.textContent);
  }
  svg.append(node('text',{x:150,y:54,'text-anchor':'middle','font-size':13},'600 км'));
  figure.append(caption,svg);host.append(figure);
 }
}
function renderDomainFraction(host,config){
 host.className='task-graphs exclusion-model';
 const title=document.createElement('p');
 title.textContent='Что происходит в точках из условия?';
 host.append(title);
 const analysis=config.analysis;
 if(!analysis?.zeros){
  const guide=document.createElement('p');
  guide.className='small';
  guide.textContent=analysis?.status==='zero'?'Знаменатель всегда равен нулю. Попробуй изменить его.':'После проверки дроби здесь появится результат подстановки каждой исключённой точки.';
  host.append(guide);return;
 }
 const list=document.createElement('ul');
 config.points.forEach((point,i)=>{
  const item=document.createElement('li');
  item.textContent='x = '+point+': '+(analysis.zeros[i]?'знаменатель равен нулю, точка исключена.':'знаменатель отличен от нуля, точка осталась в области.');
  list.append(item);
 });
 const count=document.createElement('p');
 count.className='small';count.textContent='Всего различных действительных нулей у твоего знаменателя: '+analysis.count+'.';
 host.append(list,count);
}
function renderNaturalValues(host,config){
 host.className='task-graphs natural-model';
 const heading=document.createElement('p');heading.textContent='Подстановка выбранных n';host.append(heading);
 if(!config.rows?.length){
  const guide=document.createElement('p');guide.className='small';guide.textContent='После проверки появится значение выражения для каждого числа из твоего ответа.';host.append(guide);return;
 }
 const list=document.createElement('ul');
 for(const {term,pair} of config.rows){
  const row=document.createElement('li');
  if(!pair)row.textContent='n = '+term+': это не положительное целое число.';
  else{
   const [top,bottom]=pair;
   const value=top%bottom===0n?String(top/bottom):top+'/'+bottom;
   const property=top<=0n?'не положительное число':top%bottom===0n?'натуральное число':'нецелое число';
   row.textContent='n = '+term+': '+top+' : '+bottom+' = '+value+' ('+property+').';
  }
  list.append(row);
 }
 host.append(list);
}
function workEstimate(host,config,value){
 host.className='task-graphs quantity-model';
 const proposed=number(value),line=text=>{const p=document.createElement('p');p.className='small';p.textContent=text;host.append(p);};
 if(proposed===null||proposed<=0){line('После проверки положительного ответа здесь можно сравнить модель с условием.');return;}
 const decimal=x=>x.toLocaleString('ru',{maximumFractionDigits:4});
 if(config.type==='work-hours'){
  const total=[8,9,12].reduce((n,h)=>n+proposed/h,0);
  for(const h of [8,9,12])line('Мастерица, которая тратит '+h+' ч на заказ, за '+decimal(proposed)+' ч выполнит такую долю заказа: '+decimal(proposed/h)+'.');
  line('Выполнено заказов: '+decimal(total)+'. По условию требуется 3.');
 }else{
  line('Сравниваем две равные половины по 240 км: при 60 км/ч первая занимает 4 ч, при 80 км/ч вторая — 3 ч.');
  line('Твоя скорость за 7 ч дала бы '+decimal(7*proposed)+' км. Общий путь в модели — 480 км.');
 }
}
function quadraticExample(host,value){
 host.className='task-graphs root-graph';
 const parameters=String(value).split(';').map(v=>number(v));
 const valid=parameters.length===3&&parameters.every(v=>v!==null);
 const [a,b,c]=parameters;
 const curve=valid?{kind:'quadratic',a,b,c}:null;
 const height=valid?Math.max(2,Math.abs(c),Math.abs(4*a+2*b+c),Math.abs(4*a-2*b+c)):4;
 host.append(rootGraph({curves:curve?[curve]:[],xRange:[-2,2],yRange:[-height,height]},''));
 const p=document.createElement('p');p.className='small';
 p.textContent=valid?'Для твоих коэффициентов при x = 0 значение равно '+c+', а при x = 1 — '+(a+b+c)+'.':'После проверки на осях появится график для твоих коэффициентов.';
 host.append(p);
}
function quadraticStory(host,config,value){
 const scene=config.scene;
 host.className='task-graphs quantity-model';
 const caption=document.createElement('p');caption.className='small';
 if(scene.startsWith('529')){
  const slope={'529а':1-Math.sqrt(2),'529б':4-Math.sqrt(15),'529в':Math.sqrt(35)-5.7}[scene];
  const plane={curves:value?[{kind:'line',k:slope,b:0}]:[],xRange:[-4,4],yRange:[-2,2],xTickStep:2,yTickStep:1};
  host.append(rootGraph(plane,''));caption.textContent=value?'Проверь положение лучей по обе стороны от начала координат.':'После выбора четвертей появится прямая с коэффициентом из условия.';host.append(caption);return;
 }
 const svg=node('svg',{viewBox:'0 0 300 190',role:'img','aria-label':{
  court:'Корт со сторонами w и 2w',fence:'Участок со сторонами a и 0,75a',screen:'Стороны 4u и 3u, диагональ 25 дюймов',
  'cut-square':'Квадрат, разделённый на треугольник и оставшуюся фигуру',walk:'Прямой угол между северным и западным маршрутами',fall:'Вертикальная шахта глубиной 80 метров'
 }[scene]});
 const line=(x1,y1,x2,y2,extra={})=>svg.append(node('line',{x1,y1,x2,y2,stroke:'#165d65','stroke-width':2,...extra}));
 const label=(x,y,text)=>svg.append(node('text',{x,y,'text-anchor':'middle','font-size':17,fill:'#143c3b'},text));
 const rectangle=(x,y,width,height)=>svg.append(node('rect',{x,y,width,height,fill:'#e7f4ee',stroke:'#165d65','stroke-width':2}));
 const decimal=n=>n.toLocaleString('ru',{maximumFractionDigits:3});
 const proposed=config.proposedTime??number(value);
 if(scene==='walk'){
  const x=198,y=143;line(x,y,x,43);line(x,y,73,y);line(73,y,x,43,{'stroke-dasharray':'5 3'});line(183,y,183,128);line(183,128,x,128);
  label(234,97,'4t км');label(130,170,'5t км');label(102,79,proposed>0?decimal(proposed*Math.sqrt(41))+' км':'16 км');label(199,31,'север');label(42,150,'запад');
  caption.textContent=proposed>0?'При t = '+decimal(proposed)+' ч группы пройдут '+decimal(4*proposed)+' и '+decimal(5*proposed)+' км. Расстояние между ними ≈ '+decimal(proposed*Math.sqrt(41))+' км. По условию требуется 16 км.':'Пункт выхода — вершина прямого угла. Два пройденных пути образуют катеты.';
 }else if(scene==='fall'){
  line(80,35,220,35);line(80,150,220,150);line(146,42,146,142,{'stroke-dasharray':'5 3'});line(140,132,146,142);line(152,132,146,142);
  label(90,24,'начало');label(202,105,'80 м');label(206,177,'дно');
  caption.textContent=proposed>=0&&proposed!==null?'За '+decimal(proposed)+' с модель даёт путь '+decimal(5*proposed*proposed)+' м.':'Глубина — путь камня от старта до дна.';
 }else if(scene==='cut-square'){
  rectangle(88,20,140,140);svg.append(node('polygon',{points:'88,20 228,20 228,134.72',fill:'#c1dcef',stroke:'#165d65','stroke-width':1.5}));
  label(184,55,'59 см²');label(141,123,'85 см²');label(157,183,'сторона a');
  caption.textContent=proposed>0?'Квадрат со стороной '+decimal(proposed)+' см имеет площадь '+decimal(proposed*proposed)+' см².':'Сложи площади двух частей, чтобы восстановить площадь целого квадрата.';
 }else{
  const width=scene==='court'?200:160,height=scene==='court'?100:120,x=48,y=23;
  rectangle(x,y,width,height);
  label(x+width/2,y+height+26,scene==='court'?'2w':scene==='fence'?'a':'4u');
  label(x+width+24,y+height/2+5,scene==='court'?'w':scene==='fence'?'0,75a':'3u');
  if(scene==='screen'){
   line(x,y+height,x+width,y,{'stroke-dasharray':'5 3'});label(x+width/2-13,y+height/2-10,'25″');
   caption.textContent='Диагональ делит экран на два равных прямоугольных треугольника.';
  }else if(scene==='court'){
   const pair=parseLine(value);if(pair)caption.textContent='Твои стороны дают площадь '+decimal(pair.k*pair.b)+' м². Длина по условию должна вдвое превышать ширину.';
   else caption.textContent='Прямоугольник можно разделить на два квадрата со стороной w.';
   line(x+100,y,x+100,y+height,{'stroke-dasharray':'5 3'});
  }else caption.textContent=proposed>0?'Для периметра '+decimal(proposed)+' м и отношения 4 : 3 площадь участка была бы '+decimal(12*(proposed/14)**2)+' м².':'Отношение длины к ширине равно 4 : 3. Забор проходит по всем четырём сторонам.';
 }
 host.append(svg,caption);
}

function quadraticEvidence(host,config,value){
 host.className='task-graphs root-graph';
 const caption=document.createElement('p');caption.className='small';
 if(config.type==='check-common-point'){
  const answer=parseLine(value);
  if(answer){
   for(const [k,b] of config.lines){
    const row=document.createElement('p');row.className='small';
    const ordinate=k*answer.k+b;
    row.textContent='При x = '+answer.k+' получаем y = '+ordinate+'. '+(Math.abs(ordinate-answer.b)<1e-9?'Ордината совпала.':'Твоя ордината '+answer.b+' отличается.');
    host.append(row);
   }
  }else{caption.textContent='После проверки здесь появятся две подстановки твоей точки.';host.append(caption);}
  return;
 }
 if(config.type==='quadratic-reciprocals'){
  const roots=String(value).trim().split(';').map(v=>number(v));
  if(!roots.length||roots.some(v=>v===null)){
   caption.textContent='После проверки рациональных корней сравни подстановку r в первое уравнение и 1/r во второе.';host.append(caption);return;
  }
  for(const r of roots){
   const row=document.createElement('p');row.className='small';
   const {a,b,c}=config,dec=v=>v.toLocaleString('ru',{maximumFractionDigits:5});
   row.textContent=r===0?'При r = 0 обратное число не определено. Свободный член данного уравнения не равен нулю.':
    'r = '+dec(r)+', 1/r = '+dec(1/r)+'. Левая часть первого уравнения: '+dec(a*r*r+b*r+c)+'. После перестановки a и c при 1/r: '+dec(c/(r*r)+b/r+a)+'.';
   host.append(row);
  }
  return;
 }
 let {a,b,c}=config;
 if(config.type==='quadratic-parameter'){
  const entry=M.parse(value),proposed=entry?entry.n/entry.d:null;
  if(proposed===null){
   caption.textContent='После ввода своего a и проверки появится его парабола.';host.append(caption);return;
  }
  a=1;b=-proposed;c=proposed-4;
 }
 if(!value){caption.textContent='После проверки можно сопоставить число корней с пересечениями оси x.';host.append(caption);return;}
 const discriminant=b*b-4*a*c,h=-b/(2*a),vertex=-discriminant/(4*a);
 const spread=discriminant>=0?Math.sqrt(discriminant)/(2*Math.abs(a)):0;
 const radius=Math.max(1.5,spread*1.45);
 const left=h-radius,right=h+radius;
 const ymax=Math.max(1,vertex,a*radius*radius+vertex),ymin=Math.min(-1,vertex,a*radius*radius+vertex),margin=(ymax-ymin)*.13;
 const plane={curves:[{kind:'quadratic',a,b,c}],compactTicks:Math.max(Math.abs(ymin),Math.abs(ymax))>=10000,xRange:[left,right],yRange:[ymin-margin,ymax+margin],
              label:'Парабола и горизонтальная ось y = 0 для указанного уравнения'};
 const points=discriminant>0?[[h-spread,0],[h+spread,0]]:discriminant===0?[[h,0]]:[];
 plane.points=points;
 host.append(rootGraph(plane,''));
 caption.textContent=(config.type==='quadratic-parameter'?'Для a = '+(-b).toLocaleString('ru')+' ':'')+
    'D = '+discriminant.toLocaleString('ru',{maximumFractionDigits:4})+'. Различных пересечений оси x: '+points.length+'.';
 host.append(caption);
}

function planeConstruction(host,config,value){
 host.className='task-graphs root-graph';const note=document.createElement('p');note.className='small';
 const num=z=>{const r=M.parse(String(z));return r.n/r.d;};
 const toCurve=([a,b,c])=>b?{kind:'line',k:-a/b,b:c/b}:{kind:'vertical',h:c/a};
 const groups=(config.groups||[]).map(g=>g.map(p=>p.map(r=>r.n/r.d))),points=[...groups.flat(),...(config.fixedPoints||[])],curves=[];
 if(config.type==='line-figure'){
  config.lines.forEach((l,i)=>{
   const c=toCurve(l.map(num));if(config.distinguish&&i===1)c.dashed=true;if(config.labels){c.label=config.labels[i];c.labelAt=config.labelPoints[i];}curves.push(c);
  });
 }else if(config.type==='own-lines'){
  for(const row of groups){
   if(row.length!==2)continue;
   const [[x,y],[u,v]]=row;
   if(x===u&&y===v)continue;
   curves.push(x===u?{kind:'vertical',h:x}:{kind:'line',k:(v-y)/(u-x),b:(y*u-v*x)/(u-x)});
  }
 }
 const max=config.bounds||Math.min(1000000,Math.max(5,...points.flat().map(v=>Math.ceil(Math.abs(v)*1.15))));
 host.append(rootGraph({curves,points,xRange:[-max,max],yRange:[-max,max],compactTicks:max>=10000,label:config.type==='line-figure'?'Координатный рисунок к заданию':'Координатная плоскость с твоими точками и прямыми'},''));
 note.textContent=config.distinguish?'Первая прямая сплошная, вторая штриховая. При совпадении сплошная линия видна между штрихами.':config.type==='line-figure'?'На обеих осях отмечен ноль. Отсчитывай координаты по подписанным делениям.':config.type==='own-points'?'Введённые пары отмечаются точками. Проверь каждую подстановкой в исходное уравнение.':'Через две разные точки каждой группы проводится прямая. Верная прямая содержит только решения исходного уравнения.';
 host.append(note);
}

function absLineChoice(host,config){
 host.className='task-graphs root-graph';
 const curves=[{kind:'abs-linear',k:1,b:0}],p=config.analysis,points=[[-3,0]];
 if(p)curves.push({kind:'line',k:p.k,b:p.b,dashed:true});
 if(config.checked&&p)points.push(...p.points);
 const size=Math.max(5,...points.flat().map(Math.abs))*1.15;
 host.append(rootGraph({curves,points,xRange:[-size,size],yRange:[-size/2,size],compactTicks:size>10000,
    label:'График модуля, заданная точка на оси x и твоя прямая'},''));
 const note=document.createElement('p');note.className='small';
 note.textContent='Сплошной линией показан модуль, отмечена заданная точка (−3; 0). Введённые k и b задают штриховую прямую.';
 if(config.checked&&p)note.textContent+=' Общих точек с модулем: '+(Number.isFinite(p.count)?p.count:'бесконечно много')+'.';
 if(p){note.dataset.absSlope=String(p.k);note.dataset.absCrossings=String(p.count);}
 host.append(note);
}
function systemPairModel(host,config){
 host.className='task-graphs quantity-model';
 const message=document.createElement('p');message.className='small';
 if(!config.checked||!config.evidence){
  message.textContent='После проверки для каждой предложенной пары появится результат подстановки в первое и второе равенства.';host.append(message);return;
 }
 if(!config.evidence.length){
  message.textContent='Ты указал, что решений нет. Проверь все допустимые значения из уравнения с одной переменной.';host.append(message);return;
 }
 for(const row of config.evidence){
  const p=document.createElement('p');p.className='small';p.dataset.systemEvidence=row.excluded?'excluded':row.valid.map(x=>x?'yes':'no').join('-');
  p.textContent='('+row.a+'; '+row.b+') — '+(row.excluded?'нулевая координата попадает в исходный знаменатель.':
      'первое равенство '+(row.valid[0]?'верно':'не выполняется')+', второе '+(row.valid[1]?'верно':'не выполняется')+'.');
  host.append(p);
 }
}
function inequalityIntervals(host,config){
 host.className='task-graphs number-line';
 const finite=config.cuts.map(s=>M.parse(s)).map(z=>z.n/z.d),delta=Math.max(1,(finite[1]-finite[0])/4),
       min=finite[0]-delta,max=finite[1]+delta,x=v=>30+(v-min)/(max-min)*300;
 const svg=numberLine({range:[min,max],major:Math.max(1,Math.ceil((max-min)/4)),points:[],label:'Предложенные промежутки и граничные точки неравенства'});
 for(const item of config.intervals||[]){
  const lo=Math.max(min,item.min),hi=Math.min(max,item.max);
  if(lo>=hi)continue;
  svg.append(node('line',{x1:x(lo),x2:x(hi),y1:76,y2:76,stroke:'#16735d','stroke-width':6,'data-interval-range':lo+';'+hi}));
  if(item.min===-Infinity)svg.append(node('path',{d:'M38 69 L30 76 L38 83',fill:'none',stroke:'#16735d','stroke-width':2}));
  if(item.max===Infinity)svg.append(node('path',{d:'M322 69 L330 76 L322 83',fill:'none',stroke:'#16735d','stroke-width':2}));
  for(const [v,open] of [[item.min,item.leftOpen],[item.max,item.rightOpen]])if(Number.isFinite(v)&&v>=min&&v<=max)svg.append(node('circle',{cx:x(v),cy:76,r:5,fill:open?'white':'#16735d',stroke:'#16735d','stroke-width':2}));
 }
 finite.forEach((v,i)=>svg.append(node('text',{x:x(v),y:39,'text-anchor':'middle','font-size':19,'data-critical-point':config.cuts[i]},config.cuts[i])));
 const note=document.createElement('p');note.className='small';note.textContent='Подписаны границы из условия. Зелёным отмечаются введённые тобой промежутки; стрелка показывает продолжение до бесконечности.';
 host.append(svg,note);
}

function balanceScene(host,config,value){
 host.className='task-graphs quantity-model';
 const intro=document.createElement('p');intro.className='small';
 intro.textContent='x — '+config.labels[0]+', y — '+config.labels[1]+'. Подставь свою пару и проверь оба условия.';host.append(intro);
 const fields=String(value||'').split(';'),raw=fields.map(v=>M.parse(v)),chosen=M.parse(String(value||''));
 let pair=null;
 if(config.mode==='pair'&&fields.length===2&&raw.every(Boolean))pair=raw;
 if(config.mode==='step')pair=config.trial?.split(';').map(v=>M.parse(v));
 if(config.mode==='digits'&&chosen?.d===1&&chosen.n>=10&&chosen.n<=99)pair=[M.parse(String(Math.floor(chosen.n/10))),M.parse(String(chosen.n%10))];
 if(['x','y'].includes(config.mode)&&chosen&&config.derive){
  const [slope,offset]=config.derive,n=BigInt(slope)*BigInt(chosen.n)+BigInt(offset)*BigInt(chosen.d);
  const derived=M.parse(n+'/'+chosen.d);if(derived)pair=config.mode==='x'?[chosen,derived]:[derived,chosen];
 }
 if(!pair&&config.trial)pair=config.trial.split(';').map(v=>M.parse(v));
 if(!pair||pair.length!==2||pair.some(v=>!v))pair=null;
 if(pair){
  const values=pair.map(r=>r.n/r.d),valid=config.restriction==='digits'?values.every(Number.isInteger)&&values[0]>=1&&values[0]<=9&&values[1]>=0&&values[1]<=9:
    values.every(v=>v>0&&(config.restriction!=='natural'||Number.isInteger(v)));
  const text=document.createElement('p');text.className='small';text.dataset.balanceDomain=valid?'yes':'no';
  text.textContent='x = '+M.answer(pair[0])+', y = '+M.answer(pair[1])+(config.unit?' ('+config.unit+')':'')+'. '+(valid?'Величины допустимы по смыслу.':config.restriction==='natural'?'Для количества требуются положительные целые числа.':'Проверь допустимые значения величин.');
  host.append(text);
 }
 for(const check of config.checks){
  const p=document.createElement('p');p.className='small';p.dataset.balanceRow='';
  p.textContent=check.label+': ('+check.coeff[0]+')x + ('+check.coeff[1]+')y = '+check.rhs+'.';
  if(pair){
   const [a,b]=check.coeff.map(k=>M.parse(k)),[x,y]=pair,target=M.parse(check.rhs);
   const n=BigInt(a.n)*BigInt(x.n)*BigInt(b.d)*BigInt(y.d)+BigInt(b.n)*BigInt(y.n)*BigInt(a.d)*BigInt(x.d),d=BigInt(a.d)*BigInt(x.d)*BigInt(b.d)*BigInt(y.d);
   const gcd=(u,v)=>v?gcd(v,u%v):u,g=gcd(n<0n?-n:n,d),num=n/g,den=d/g;
   p.dataset.balanceCheck=num*BigInt(target.d)===den*BigInt(target.n)?'yes':'no';
   p.append(' Получено '+(den===1n?num.toString():num+'/'+den)+'.');
  }
  host.append(p);
 }
}

function residualScene(host,config){
 host.className='task-graphs root-graph';
 const [a,b,c]=config.coefficients,checks=config.checks||[];
 const vertex=-b/(2*a),height=c-b*b/(4*a);
 const width=Math.max(2,Math.abs(vertex)*1.2+1,Math.sqrt(Math.abs(height/a))+Math.abs(vertex)+1);
 const limit=Math.max(2,Math.abs(height)*1.25,Math.abs(c)*1.25);
 const plot=rootGraph({curves:[{kind:'quadratic',a,b,c}],points:checks.filter(q=>Number.isFinite(q.x)).map(q=>[q.x,q.exact?0:a*q.x*q.x+b*q.x+c]),
 xRange:[-width,width],yRange:[-limit,limit],axisLabels:[config.unknown||'x','F'],label:'График разности левой и правой частей исходного уравнения'},'');
 host.append(plot);
 for(const item of checks){
  const row=document.createElement('p');row.className='small';row.dataset.rootResidual=item.exact?'zero':'nonzero';
  row.textContent='Подстановка '+item.value+': '+(item.exact?'остаток равен нулю.':config.mode==='rounded'?'остаток не нулевой. При округлении само значение обычно отличается от точного корня.':'остаток не равен нулю. Проверь знаки и знаменатель.');
  host.append(row);
 }
 if(!checks.length){const row=document.createElement('p');row.className='small';row.textContent='Введи предложенные корни. Для каждого модель отдельно проверит подстановку.';host.append(row);}
}
function squareCertificateScene(host,config,value){
 host.className='task-graphs construction';
 const entries=String(value||'').split(';').map(v=>M.parse(v)),complete=entries.length===config.targets.length*3&&entries.every(Boolean);
 config.targets.forEach(([a,b,c],i)=>{
  const h=-b/(2*a),r=c-b*b/(4*a),width=Math.max(3,Math.abs(h)+2),limit=Math.max(4,Math.abs(c)*1.3,Math.abs(r)*1.3);
  const curves=[{kind:'quadratic',a,b,c}],caption=document.createElement('p');caption.className='small';
  caption.textContent='Исследуем '+config.labels[i]+'. ';
  if(complete){
   const [kr,hr,rr]=entries.slice(3*i,3*i+3),[k,shift,rest]=[kr,hr,rr].map(v=>v.n/v.d);
   const eq=(x,y)=>x===y,toB=v=>BigInt(v),kn=toB(kr.n),kd=toB(kr.d),hn=toB(hr.n),hd=toB(hr.d),rn=toB(rr.n),rd=toB(rr.d);
   const match=eq(kn,toB(a)*kd)&&eq(-2n*kn*hn,toB(b)*kd*hd)&&eq(kn*hn*hn*rd+rn*kd*hd*hd,toB(c)*kd*hd*hd*rd);
   caption.dataset.squareCertificate=match?'yes':'no';
   caption.textContent+=(match?'Коэффициенты после раскрытия совпали. ':'Коэффициенты после раскрытия отличаются. ')+(k>0&&rest>0?'K и R положительны.':'Проверь, доказывают ли знаки K и R строгую положительность.');
   if([k,shift,rest].every(v=>Number.isFinite(v)&&Math.abs(v)<=1000000))curves.push({kind:'quadratic',a:k,b:-2*k*shift,c:k*shift*shift+rest,dashed:true});
  }else caption.textContent+='Сплошная кривая — исходный трёхчлен. После ввода коэффициентов пунктир покажет твою запись.';
  host.append(rootGraph({curves,xRange:[-width,width],yRange:[-limit/6,limit],axisLabels:[config.symbol,'F'],label:'Сравнение квадратичных выражений: '+config.labels[i]},''),caption);
 });
}

function sequenceRows(raw,config){
 const text=String(raw??'').trim();
 if(!text||text.length>220)return null;
 const pattern=/\(([^()]*)\)/g,matches=[...text.matchAll(pattern)];
 const groups=matches.length?matches.map(x=>x[1]):[text];
 if(matches.length&&!/^\([^()]*\)(?:\s*,\s*\([^()]*\))*$/.test(text)||groups.length>4)return null;
 const rows=groups.map(group=>group.split(';').map(v=>M.parse(v.trim())));
 if(rows.some(row=>row.length!==config.size||row.some(v=>!v||v.d!==1||Math.abs(v.n)>10000)))return null;
 return rows.map(row=>row.map(r=>r.n));
}
function sequenceEvidence(raw,config){
 return sequenceRows(raw,config)?.map(row=>{
  const ordered=row.every((v,i)=>!i||v===row[i-1]+config.stride);
  const domain=row.every(v=>(!config.natural||v>0)&&(!config.odd||Math.abs(v%2)===1)&&(!config.even||v%2===0));
  const result=config.mode==='sum-square'?row.reduce((s,v)=>s+v,0)**2-row.reduce((s,v)=>s+v*v,0):row.reduce((s,v,i)=>s+config.weights[i]*v**config.power,0);
  return {row,ordered,domain,result,correct:ordered&&domain&&result===config.target};
 })||[];
}
function sequenceScene(host,config,value){
 host.className='task-graphs quantity-model';
 const evidence=sequenceEvidence(value,config),note=document.createElement('p');note.className='small';
 note.textContent='Соседние числа отличаются на '+config.stride+'. '+(config.natural?'Все члены положительны.':'Нулевые и отрицательные целые допустимы.');host.append(note);
 for(const item of evidence){
  const p=document.createElement('p');p.className='small';p.dataset.sequenceTest=item.correct?'yes':'no';
  p.textContent=item.row.join(' → ')+'. '+(!item.ordered?'Нарушен шаг между числами. ':!item.domain?'Значения нарушают условие на числа. ':'Порядок и вид чисел подходят. ')+'Разность из условия равна '+item.result+'; требуется '+config.target+'.';host.append(p);
 }
}
function measureScene(host,config,value){
 host.className='task-graphs quantity-model';
 const fmt=v=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:4}).format(v||0),text=(s,valid)=>{
  const p=document.createElement('p');p.className='small';p.textContent=s;if(typeof valid==='boolean')p.dataset.measureCheck=valid?'yes':'no';host.append(p);
 };
 const input=String(value??'').trim(),parts=input.split(';').map(v=>M.parse(v)),finite=parts.every(r=>r&&Math.abs(r.n/r.d)<=10000);
 if(config.scene==='price-loss'||config.scene==='box-volume'){
  const price=config.scene==='price-loss';
  text(price?'Покупка минус убыток равна цене продажи.':'Высота 0,5 м; ширина x; длина 2x. Площадь дна 2x², боковых стенок 3x, объём x².');
  if(!input||!finite||parts.length>2)return;
  for(const r of parts){
   const v=r.n/r.d,n=BigInt(r.n),d=BigInt(r.d);
   if(v<=0||(price&&v>=100)){text(price?'Цена должна быть положительной, а убыток — меньше 100%.':'Объём ящика должен быть положителен.',false);continue;}
   if(price)text('Покупка '+fmt(v)+'; убыток '+fmt(v*v/100)+'; продажа '+fmt(v-v*v/100)+' пистолей.',100n*n*d-n*n===2400n*d*d);
   else{
    const w=Math.sqrt(v);
    text('При объёме '+fmt(v)+' м³ ширина ≈ '+fmt(w)+' м, площадь стенок ≈ '+fmt(3*w)+' м² и дна '+fmt(2*v)+' м². Разность ≈ '+fmt(3*w-2*v)+' м².',
      9n*n*d*625n===(50n*n+27n*d)**2n);
   }
  }
  return;
 }
 const svg=node('svg',{viewBox:'0 0 300 170',role:'img'});
 const rect=(x,y,w,h,fill,attrs={})=>svg.append(node('rect',{x,y,width:w,height:h,fill,stroke:'#205764','stroke-width':1.5,...attrs}));
 const lab=(x,y,s)=>svg.append(node('text',{x,y,'text-anchor':'middle','font-size':15,fill:'#17434c'},s));
 function planar(width,height,margin,kind,symbolic){
  const scale=Math.min(205/width,97/height),W=width*scale,H=height*scale,x=150-W/2,y=30+(97-H)/2;
  rect(x,y,W,H,'#e4efe9',{'data-measure-part':'outer'});
  if(margin>0&&2*margin<Math.min(width,height)){
   const q=margin*scale;
   if(kind==='sheet'){
    for(const xx of [x,x+W-q])for(const yy of [y,y+H-q])rect(xx,yy,q,q,'#fae6ba',{'data-measure-part':'cut'});
    rect(x+q,y+q,W-2*q,H-2*q,'#c4e6e2',{'stroke-dasharray':'4 3','data-measure-part':'base'});
   }else rect(x+q,y+q,W-2*q,H-2*q,'#c4e6e2',{'data-measure-part':'inside'});
  }
  lab(150,18,kind==='sheet'?'Лист с угловыми вырезами':'Наружный прямоугольник');lab(150,151,symbolic||fmt(width)+' × '+fmt(height));
  svg.setAttribute('aria-label',symbolic||'Наружные размеры '+fmt(width)+' и '+fmt(height)+(margin?'; ширина края '+fmt(margin):''));
 }
 function adjacent(short,long,symbolic){
  const k=128/(short+long),W=long*k,H=short*k,x=(300-W-H)/2,y=15;
  rect(x,y,W,H,'#edf1e9',{'data-measure-part':'rectangle'});
  rect(x,y+H,W,W,'#c2e4e1',{'data-measure-part':'long-square'});
  rect(x+W,y,H,H,'#fae6ba',{'data-measure-part':'short-square'});
  lab(150,162,symbolic?'Квадраты на соседних сторонах':fmt(short)+'² + '+fmt(long)+'²');
  svg.setAttribute('aria-label','Прямоугольник и два квадрата на его соседних сторонах');
 }
 const outer=config.scene==='outward-frame',inner=config.scene==='inward-frame',sheet=config.scene==='folded-sheet';
 if(!input||!finite||parts.length!==(outer||inner?1:2)){
  if(outer)planar(22,16,2,'frame','18 + 2x и 12 + 2x');
  else if(inner)planar(4.5,2.5,.4,'frame','Внутри: 4,5 − 2x и 2,5 − 2x');
  else if(sheet)planar(45,30,8,'sheet','Дно: 1,5x − 16 и x − 16');
  else adjacent(3,6,true);
  host.append(svg);
  text(outer?'Внутри фото 12 × 18 см. Снаружи к каждой стороне прибавляются две ширины рамки.':inner?'Снаружи 4,5 × 2,5 м. Внутренняя сторона уменьшается на две ширины бордюра.':sheet?'По каждому краю листа отгибается полоса 8 см. Введи длину и ширину листа, чтобы увидеть четыре угловых выреза.':'Две соседние стороны задают периметр и стороны двух квадратов.');return;
 }
 const values=parts.map(r=>r.n/r.d),[v,w]=values,n=BigInt(parts[0].n),d=BigInt(parts[0].d);
 if(outer||inner){
  if(v<=0||inner&&v>=1.25){text('Такая ширина не оставляет положительными все размеры исходной фигуры.',false);return;}
  const W=outer?18+2*v:4.5,H=outer?12+2*v:2.5;
  planar(W,H,v,'frame');host.append(svg);
  if(outer)text('Наружная площадь '+fmt(W*H)+' см²; по условию 280 см².',(18n*d+2n*n)*(12n*d+2n*n)===280n*d*d);
  else text('Внутренняя площадь '+fmt((W-2*v)*(H-2*v))+' м²; площадь бордюра '+fmt(W*H-(W-2*v)*(H-2*v))+' м².',(9n*d-4n*n)*(5n*d-4n*n)===32n*d*d);
 }else{
  const m=BigInt(parts[1].n),e=BigInt(parts[1].d);
  if(v<=0||w<=0||sheet&&(v<=16||w<=16)){text('Размеры должны быть положительными'+(sheet?' и оставлять дно после вырезания 16 см по каждой стороне.':'.'),false);return;}
  if(sheet)planar(v,w,8,'sheet');else adjacent(v,w,false);host.append(svg);
  if(sheet)text('Размеры дна '+fmt(v-16)+' × '+fmt(w-16)+' см; объём '+fmt((v-16)*(w-16)*8)+' см³. Отношение длины к ширине '+fmt(v/w)+'.',2n*n*e===3n*m*d&&8n*(n-16n*d)*(m-16n*e)===6080n*d*e);
  else text('Стороны '+fmt(v)+' и '+fmt(w)+' см. Периметр '+fmt(2*(v+w))+' см, сумма площадей квадратов '+fmt(v*v+w*w)+' см².',v<=w&&2n*(n*e+m*d)===28n*d*e&&n*n*e*e+m*m*d*d===116n*d*d*e*e);
 }
}

function fractionSample(value,count){
 const parts=String(value??'').split(';').map(v=>M.parse(v.trim()));
 return parts.length===count&&parts.every(v=>v&&Math.abs(v.n/v.d)<=100)?parts:null;
}
function sourceFractionTrial(config,value,unrestricted=false){
 const fields=unrestricted?String(value??'').split(';').map(v=>M.parse(v)):fractionSample(value,config.symbols.length);
 if(unrestricted&&(fields.length!==config.symbols.length||fields.some(v=>!v)))return null;
 if(!fields)return null;
 const values=new Map(config.symbols.map((symbol,i)=>[symbol,fields[i]]));
 function evaluate(tree){
  if(!Array.isArray(tree)){const r=values.get(tree)||M.parse(tree);return r?[BigInt(r.n),BigInt(r.d)]:null;}
  const [op,left,right]=tree,a=evaluate(left);if(!a)return null;
  if(op==='neg')return [-a[0],a[1]];
  const b=evaluate(right);if(!b)return null;
  if(op==='+')return [a[0]*b[1]+b[0]*a[1],a[1]*b[1]];
  if(op==='-')return [a[0]*b[1]-b[0]*a[1],a[1]*b[1]];
  if(op==='*')return [a[0]*b[0],a[1]*b[1]];
  if(op==='/')return b[0]?[a[0]*b[1],a[1]*b[0]]:null;
  if(op==='^'&&b[1]===1n&&b[0]>=0n&&b[0]<=4n)return [a[0]**b[0],a[1]**b[0]];
  return null;
 }
 function format(v){
  if(!v)return null;
  let [n,d]=v;if(d<0n){d=-d;n=-n;}
  let u=n<0n?-n:n,w=d;while(w){const rem=u%w;u=w;w=rem;}
  return d/u===1n?String(n/u):(n/u)+'/'+(d/u);
 }
 return {original:format(evaluate(config.original)),reduced:format(evaluate(config.reduced))};
}
function sourceFractionScene(host,config){
 host.className='task-graphs quantity-model';const input=config.fixedInput||config.trial||config.symbols.map(()=>0).join(';'),check=sourceFractionTrial(config,input);
 const add=(message,k,status)=>{const row=document.createElement('p');row.className='small';row.textContent=message;if(k){row.dataset.fractionSide=k;row.dataset.fractionStatus=status;}host.append(row);};
 if(!check){add('Введи '+(config.symbols.length===2?'пару рациональных чисел через точку с запятой':'рациональное число')+' от −100 до 100.');return;}
 add((config.trial?'Твоя подстановка: ':'Пример подстановки: ')+config.symbols.map((s,i)=>s+' = '+input.split(';')[i]).join(', ')+'.');
 if(config.fixedInput&&!config.showValue){
  add('Вычисли знаменатель и числитель при указанном x. Итоговая дробь появится после проверки результата.');
  if(config.partial?.[0])add('Твой знаменатель: '+config.partial[0]+'.');
  if(config.partial?.[1])add('Твой числитель: '+config.partial[1]+'.');
  return;
 }
 const row=(title,k)=>add(title+(check[k]===null?'не определена.':'равна '+check[k]+'.'),k,check[k]===null?'undefined':'defined');
 row('Исходная запись ', 'original');row('Упрощённая формула ', 'reduced');
 if(check.original===null&&check.reduced!==null)add('После сокращения получено число, но исходное выражение здесь не определено. Запрет сохраняется.');
}

function rationalScene(host,config){
 host.className='task-graphs root-graph';
 const add=(message,tag,valid)=>{const row=document.createElement('p');row.className='small';row.textContent=message;if(tag)row.dataset[tag]=valid;host.append(row);};
 const marks=[];
 if(config.type==='rational-root-audit'){
  for(const row of config.checks||[]){
   const outcome=row.forbidden?'excluded':row.exact?'root':'nonzero';
   add(row.value+': '+(row.forbidden?'исходный знаменатель нулевой; точка исключена.':row.exact?'числитель равен нулю, все исходные знаменатели допустимы.':'числитель не равен нулю.'),'rationalRoot',outcome);
   if(config.curves&&!row.forbidden&&Number.isFinite(row.x))marks.push([row.x,curveValue(config.curves[0],row.x)]);
  }
  if(!config.checks?.length)add('Подстановка каждого предложенного корня проверяет исходные запреты и числитель отдельно.');
 }else if(config.type==='graph-root-reading'){
  for(const entry of config.readings||[]){
   const ordinates=config.curves.map(curve=>curveValue(curve,entry.x));
   if(ordinates.every(Number.isFinite)){for(const y of ordinates)marks.push([entry.x,y]);add('При x ≈ '+entry.x.toLocaleString('ru',{maximumFractionDigits:3})+' значения графиков ≈ '+ordinates.map(z=>z.toLocaleString('ru',{maximumFractionDigits:3})).join(' и ')+'.');}
   else add('При x = 0 дробь не определена.');
  }
  if(!config.readings?.length)add('Найди общие точки двух графиков и считай их абсциссы. Обрати внимание на ветви по разные стороны нуля.');
 }else{
  for(const p of config.pairs||[]){
   const y=config.curves.map(curve=>curveValue(curve,p[0])),matches=y.map(v=>Number.isFinite(v)&&Math.abs(v-p[1])<1e-8);
   marks.push(p);add('Точка ('+p.map(v=>v.toLocaleString('ru',{maximumFractionDigits:3})).join('; ')+'): '+(matches.every(Boolean)?'лежит на обоих графиках.':y.some(v=>!Number.isFinite(v))?'не входит в область одного из графиков.':'проверь абсциссу и ординату по обеим формулам.'),'intersectionTrial',matches.every(Boolean)?'yes':'no');
  }
 }
 if(config.curves){
  const curves=config.curves.map((curve,i)=>i?{...curve,dashed:true}:curve);
  let first='левая часть равенства',second='правая часть равенства';
  if(config.level!==undefined){first='функция из задания';second='горизонталь y = '+String(config.level).replace('.',',');}
  else if(curves[1].kind==='line'&&curves[1].k===0&&curves[1].b===0){first='функция из задания';second='ось y = 0';}
  else if(config.type==='graph-root-reading'){
   first='y = '+curves[0].k+'/|x|';
   second=curves[1].kind==='quadratic'?'y = x²':curves[1].k===1?'y = x + 1':'y = 1,5x − 2';
  }
  const legend=document.createElement('p');legend.className='small';legend.textContent='Сплошная линия — '+first+'. Пунктир — '+second+'.';
  host.prepend(rootGraph({curves,xRange:config.xRange,yRange:config.yRange,points:marks,label:legend.textContent},''),legend);
 }
}

function parameterSample(value) {
 const r=M.parse(String(value??''));
 return r&&Math.abs(r.n/r.d)<=24&&8%r.d===0?r.n/r.d:null;
}
function parameterExample(config,value) {
 const t=parameterSample(value);
 if(t===null)return null;
 const [a,b,c]=config.coefficients.map(row=>row.reduceRight((acc,coefficient)=>acc*t+coefficient,0));
 const d=b*b-4*a*c;
 const roots=a===0?(b===0?[]:[-c/b]):d<0?[]:d===0?[-b/(2*a)]:[(-b-Math.sqrt(d))/(2*a),(-b+Math.sqrt(d))/(2*a)].sort((u,v)=>u-v);
 return {t,a,b,c,d,roots,count:a===0&&b===0&&c===0?'all':String(roots.length)};
}
function parameterScene(host,config) {
 host.className='task-graphs construction';
 const trial=config.trial,model=parameterExample(config,trial||'0'),caption=document.createElement('p');
 caption.className='small';
 if(!model){caption.textContent='Для опыта введи число от −24 до 24 с шагом 1/8.';host.append(caption);return;}
 const {t,a,b,c,roots,count}=model;
 const format=v=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:3}).format(v||0);
 const center=a?-b/(2*a):0,vertex=a?c-b*b/(4*a):c;
 const horizontal=Math.max(2,Math.abs(center)*1.25,...roots.map(v=>Math.abs(v)*1.25));
 const vertical=Math.max(2,Math.abs(vertex)*1.25,Math.abs(c)*1.25,Math.abs(b)*horizontal*.2);
 const graph=rootGraph({curves:[a?{kind:'quadratic',a,b,c}:{kind:'line',k:b,b:c}],points:roots.map(v=>[v,0]),
  xRange:[-horizontal,horizontal],yRange:[-vertical,vertical],compactTicks:horizontal>=1000||vertical>=10000,
  axisLabels:[config.unknown||'x','F'],label:'График левой части после переноса всех членов влево, при '+config.symbol+' = '+format(t)},'');
 graph.dataset.parameterValue=String(t);graph.dataset.solutionCount=count;
 const names={'all':'график совпадает с горизонтальной осью, подходит любое число','0':'пересечений с горизонтальной осью нет','1':'одна общая точка с горизонтальной осью','2':'две общие точки с горизонтальной осью'};
 caption.textContent=(trial?'Твой опыт':'Начальный пример')+' при '+config.symbol+' = '+format(t)+'. '+(a?'Парабола':b?'Прямая':'Постоянная функция')+', '+names[count]+'.';
 host.append(graph,caption);
}

function equationExamples(host,value){
 host.className='task-graphs quantity-model';
 const parts=String(value||'').split(';').map(x=>x.trim());
 const note=document.createElement('p');note.className='small';
 if(parts.length!==4||parts.some(x=>!M.parse(x))){note.textContent='После ввода четырёх коэффициентов здесь появятся оба твоих уравнения.';}
 else{
  const [a,b,c,d]=parts;
  note.textContent='Целое: ('+a+')x + ('+b+') = 0. Дробное: 1 / (x − ('+c+')) = '+d+'. Знаменатель исключает x = '+c+'.';
  note.dataset.equationPair='';
 }
 host.append(note);
}
function boundNote(host,text) {
 const p=document.createElement('p'); p.className='small'; p.textContent=text;host.append(p);return p;
}
function cubeRead(raw){
 const text=String(raw??'').trim().toLowerCase().replace(/\s/g,'');
 if(['∛12','∛(12)','cbrt(12)','12^(1/3)'].includes(text))return {x:Math.cbrt(12),exact:true,valid:true};
 const q=M.parse(raw);if(!q)return null;const x=q.n/q.d;
 const digits=/^[+-]?\d+[.,](\d+)$/.exec(text)?.[1].length;
 const precision=Math.min(8,Math.max(1,digits??1));return {x,exact:false,valid:Math.abs(x-Math.cbrt(12))<=0.5*10**(-precision)+Number.EPSILON};
}
function sourceInequalityCase(host,g,value){
 host.className='task-graphs quantity-model';const raw=g.partial?.[0],trial=M.parse(raw),candidate=M.parse(value);
 if(g.showAxis&&g.proposal)intervalNumberLine(host,{mode:'operation',givenRows:[],proposal:g.proposal,points:[]},value);
 const say=(s,attr,v)=>{const p=boundNote(host,s);if(attr)p.dataset[attr]=String(v);return p;};
 if(g.mode==='cube-crossing'){
  const point=cubeRead(value),x=point?.x;const graphCfg={xRange:[-4,5],yRange:[-8,12],xTickStep:1,yTickStep:4,curves:[{kind:'hyperbola',k:12},{kind:'square',dashed:true}],points:x!==undefined&&x!==0?[[x,12/x],[x,x*x]]:[],label:'Гипербола y=12/x и парабола y=x²'};
  host.append(rootGraph(graphCfg));say('Сплошная линия — гипербола y = 12/x, штриховая — парабола y = x².');
  if(point)say(x===0?'В нуле гипербола не определена.':'При твоём x ≈ '+x.toLocaleString('ru-RU',{maximumFractionDigits:5})+' получаются '+(12/x).toLocaleString('ru-RU',{maximumFractionDigits:5})+' и '+(x*x).toLocaleString('ru-RU',{maximumFractionDigits:5})+'.','cubeProbe',point.valid?'matching':'different');return;
 }
 if(g.mode==='constant'||g.mode==='radical'){
  const test=linearTrial(g,raw);if(test)say('Твоя подстановка: '+test.left+' '+test.sign+' '+test.right+'. Нужный знак '+g.operator+(test.holds?' выполняется.':' не выполняется.'),'caseProbe',test.holds?'yes':'no');
  else say(g.mode==='radical'?'Введи переменную на первом шаге и проверь знак подкоренного выражения.':'Проверь исходное сравнение на своём примере.');return;
 }
 if(['numerator-root','denominator-root','parameter-roots'].includes(g.mode)){
  if(!trial){say('На первом шаге предложи значение для подстановки. Оно проверяется в исходных условиях.');return;}
  if(g.mode==='parameter-roots'){const first=g.which===962,lin=first?-5:4,d=linearTrial({left:[first?'416':'-128',first?'80':'96','0'],right:['0','0','0'],operator:'>'},raw);
   const exceptional=M.equal(trial,lin),count=exceptional?1:d.sign==='>'?2:d.sign==='='?1:0;
   say(exceptional?'Старший коэффициент равен нулю. Линейное уравнение имеет один корень.':'Уравнение квадратное; D = '+d.left+'. Число различных действительных корней: '+count+'.','parameterRoots',count);return;}
  const first=g.mode==='numerator-root',r=linearTrial({left:first?['7','-14','0']:['4','-1','0'],right:['0','0','0'],operator:'≥'},raw),excluded=M.equal(trial,first?-8:3);
  say('Подкоренное выражение равно '+r.left+'. '+(!r.holds?'Корень не определён.':excluded?'Весь знаменатель обращается в нуль.':'Корень определён, знаменатель ненулевой.'),'domainReason',!r.holds?'radical':excluded?'denominator':'valid');return;
 }
 if(g.mode==='integer-bound'){say('Граница равна '+g.bound+'. Из целых подходят лежащие '+(g.relation==='<'?'левее':'правее')+' неё.');if(candidate)say('Твоё целое: '+M.answer(candidate)+'.');return;}
 if(g.mode==='rectangle'||g.mode==='box'){
  const box=g.mode==='box',svg=node('svg',{viewBox:'0 0 280 146',role:'img','aria-label':box?'Параллелепипед с основанием 12 на 5 и выбранной высотой':'Прямоугольник со стороной 6 и выбранной второй стороной'});
  const size=trial?.n>0?trial.n/trial.d:null,base=box?12:6,scale=Math.min(152/base,75/(size||base)),w=base*scale,h=(size||base)*scale,dy=box?16:0,dx=box?25:0;
  const x=32,y=107;svg.append(node('rect',{x,y:y-h,width:w,height:h,fill:'#e5f2eb',stroke:'#197464','stroke-width':2}));
  if(box)svg.append(node('path',{d:'M'+x+' '+(y-h)+' l'+dx+' -'+dy+' h'+w+' v'+h+' l-'+dx+' '+dy+' M'+(x+w)+' '+(y-h)+' l'+dx+' -'+dy,stroke:'#65518c',fill:'none','stroke-width':2}));
  svg.append(node('text',{x:x+w/2,y:131,'font-size':13},String(base)),node('text',{x:x+w+dx+5,y:y-h/2,'font-size':13},size?M.answer(trial):box?'h':'x'));
  host.append(svg);say(box?'Площадь основания 60 дм², предельный объём 729 дм³.':'Периметр прямоугольника 2(6+x), предельный периметр 16 см.');
  if(size)say((box?'Объём при выбранной высоте: ':'Периметр при выбранной стороне: ')+(box?60*size:2*(6+size)).toLocaleString('ru-RU',{maximumSignificantDigits:8})+(box?' дм³.':' см.'),'sizeProbe',size);return;
 }
 if(g.mode==='surd'){say('При x = 1 − √3 разложи числитель и знаменатель на рациональную часть и коэффициент при √3.');if(g.partial?.[0])say('Введённый коэффициент числителя: '+g.partial[0]+'.');return;}
 const v=candidate||(g.mode==='bindery'?trial:null);if(!v){say({bindery:'Сравни полные стоимости двух заказов.',transfer:'Общий расход складывается из суммы перевода, 7 р. и 5%.','boat-range':'Путь туда и обратно одинаков, скорости 20 и 16 км/ч.','boat-speed':'При течении 3 км/ч собственная скорость должна быть больше 3.'}[g.mode]||'Проверь своё число в задаче.');return;}
 const x=v.n/v.d,fmt=n=>n.toLocaleString('ru-RU',{maximumFractionDigits:5});
 if(g.mode==='bindery'){if(v.d!==1||v.n<=0){say('Число книг должно быть натуральным.');return;}say('Для '+M.answer(v)+' книг первая стоимость '+fmt(480*x+630)+' р., вторая '+fmt(485*x+580)+' р.','caseProbe',480*x+630<485*x+580?'yes':'no');}
 if(g.mode==='transfer')say('При сумме '+fmt(x)+' р. общий расход составит '+fmt(1.05*x+7)+' р.','caseProbe',1.05*x+7<=800?'yes':'no');
 if(g.mode==='boat-range')say('Общее время на '+fmt(x)+' км в каждую сторону составляет '+fmt(x/20+x/16)+' ч.','caseProbe',x>=0&&x/20+x/16<=3?'yes':'no');
 if(g.mode==='boat-speed'){if(x<=3){say('Против течения лодка должна двигаться вперёд: v > 3.');return;}say('Вниз по течению '+fmt(30/(x+3))+' ч, вверх '+fmt(30/(x-3))+' ч. Сумма '+fmt(30/(x+3)+30/(x-3))+' ч.');}
}


function linearTrial(config,raw){
 const x=M.parse(raw);if(!x)return null;
 function narrow(n,d){let a=n<0n?-n:n,b=d;while(b){const next=a%b;a=b;b=next;}return [n/a,d/a];}
 function evaluate(coefficients){
  let n=0n,d=1n;for(const raw of coefficients.slice().reverse()){
   const c=M.parse(raw),xn=BigInt(x.n),xd=BigInt(x.d),cn=BigInt(c.n),cd=BigInt(c.d);
   [n,d]=narrow(n*xn*cd+cn*d*xd,d*xd*cd);
  }
  return {n,d,label:String(n)+(d===1n?'':'/'+d)};
 }
 const left=evaluate(config.left),right=evaluate(config.right);
 const delta=left.n*right.d-right.n*left.d,sign=delta<0n?'<':delta>0n?'>':'=';
 const holds={'<':delta<0n,'>':delta>0n,'≤':delta<=0n,'≥':delta>=0n}[config.operator];
 return {left:left.label,right:right.label,sign,holds};
}
function compareRationals(a,b){
 return BigInt(a.n)*BigInt(b.d)-BigInt(b.n)*BigInt(a.d);
}
function withinBounds(raw,bounds){
 const values=String(raw??'').split(';').map(v=>M.parse(v));
 if(values.length!==bounds.length||values.some(v=>!v))return false;
 return bounds.every(([low,high,closed],i)=>{
  const a=compareRationals(values[i],M.parse(low)),b=compareRationals(values[i],M.parse(high));
  return closed?a>=0n&&b<=0n:a>0n&&b<0n;
 });
}
function drawMidsegment(host,mode,top,bottom){
 const svg=node('svg',{viewBox:'0 0 280 110',role:'img','aria-label':mode==='triangle-mid'?'Треугольник и отрезок между серединами боковых сторон':'Трапеция и отрезок между серединами боковых сторон'});
 const width=234/Math.max(top,bottom),left=140-bottom*width/2,right=140+bottom*width/2;
 const a=140-top*width/2,b=140+top*width/2;
 svg.append(node('polygon',{points:[left+',90',right+',90',b+',12',a+',12'].join(' '),fill:'#edf6f3',stroke:'#275e57','stroke-width':2}));
 const mid=[(left+a)/2,(right+b)/2];
 svg.append(node('line',{x1:mid[0],x2:mid[1],y1:51,y2:51,stroke:'#894418','stroke-width':3,'data-midsegment':mode}));
 mid.forEach(x=>svg.append(node('circle',{cx:x,cy:51,r:4,fill:'#894418'})));
 host.append(svg);
}
function betweenSurd(raw,g){
 const x=M.parse(raw);if(!x||x.n<=0)return false;
 const n=BigInt(x.n),d=BigInt(x.d),rad=BigInt(g.radicand)*d*d,edge=BigInt(g.bound)*d;
 return g.aboveRoot?n*n>rad&&n<edge:n*n<rad&&n>edge;
}
function isInAxis(row,q){
 if(!q)return false;
 return row.some(r=>(r.left==='-∞'||(r.leftOpen?compareRationals(q,r.left)>0n:compareRationals(q,r.left)>=0n))&&
                     (r.right==='+∞'||(r.rightOpen?compareRationals(q,r.right)<0n:compareRationals(q,r.right)<=0n)));
}
function setProbe(mode,q){
 if(mode==='integer-positive')return [q.d===1,q.n>0];
 if(q.d!==1||q.n<1)return [false,false];
 let prime=q.n>=2;
 for(let d=2;prime&&d*d<=q.n;d++)if(q.n%d===0)prime=false;
 return [prime,q.n%2===1];
}
function signGraph(host,g,q){
 const x0=-1,x1=5,px=x=>30+(x-x0)*246/(x1-x0),py=y=>105-y*4.4;
 const svg=node('svg',{viewBox:'0 0 304 205',role:'img','aria-label':'График y = −6x + 12, точка пересечения с осью и участок, заданный твоим ответом'});
 const segment=(a,b,color,width,attrs={})=>svg.append(node('line',{x1:px(a),y1:py(12-6*a),x2:px(b),y2:py(12-6*b),stroke:color,'stroke-width':width,...attrs}));
 svg.append(node('line',{x1:12,x2:291,y1:py(0),y2:py(0),stroke:'#445c56'}),node('line',{x1:px(0),x2:px(0),y1:14,y2:195,stroke:'#445c56'}));
 segment(x0,x1,'#798984',2);
 for(const r of g.proposal||[]){
  const lo=Math.max(x0,r.min),hi=Math.min(x1,r.max);
  if(lo>hi)continue;
  segment(lo,hi,'#087067',5,{'data-function-interval':'selected'});
  for(const [v,open] of [[r.min,r.leftOpen],[r.max,r.rightOpen]])if(Number.isFinite(v)&&v>=x0&&v<=x1)svg.append(node('circle',{cx:px(v),cy:py(12-6*v),r:5,fill:open?'white':'#087067',stroke:'#087067','stroke-width':2,'data-function-end':open?'open':'closed'}));
 }
 for(const [x,y,label]of [[0,12,'12'],[2,0,'2'],[0,0,'0']])svg.append(node('text',{x:px(x)+(x?5:-8),y:py(y)+(y?0:15),'font-size':12,'text-anchor':x?'start':'end'},label));
 svg.append(node('text',{x:290,y:py(0)-7,'font-size':13},'x'),node('text',{x:px(0)+6,y:16,'font-size':13},'y'));
 if(q){const x=q.n/q.d;if(x>=x0&&x<=x1){const y=12-6*x;svg.append(node('line',{x1:px(x),x2:px(x),y1:py(0),y2:py(y),stroke:'#a04b23','stroke-dasharray':'2 2'}),node('rect',{x:px(x)-3,y:py(y)-3,width:6,height:6,fill:'#94451c','data-ordinate-mark':'inside'}));}
 else boundNote(host,'Твоя точка лежит '+(x<x0?'левее':'правее')+' видимой части графика. Её точная ордината указана в проверке подстановки.');}
 host.append(svg);boundNote(host,'Серым показана вся видимая прямая, цветом — часть, соответствующая твоему промежутку. Квадрат отмечает твою подстановку.');
}
const riverReadings=[[0,0],[1,.5],[2,1.5],[3,4],[4,5.5],[6,6.2],[8,5.8],[10,5],[12,4]];
function tankTrial(t){
 if(!Number.isFinite(t)||t<0||t>150)return null;
 if(t<40)return {value:2*t+20,stage:'raise'};
 if(t<=60)return {value:100,stage:'hold'};
 return {value:140-2*t/3,stage:'cool'};
}
function behaviorHeight(mode,x){
 if(mode==='abs')return Math.abs(x);
 if(mode==='river')return readingHeight(riverReadings,x);
 if(mode.startsWith('tank'))return tankTrial(x)?.value??NaN;
 if(mode.startsWith('cubic'))return x>=-3&&x<=3?x*x*x-8*x:NaN;
 if(mode.startsWith('reciprocal'))return x>=-1.5&&x<=6?4/(x+2):NaN;
 return NaN;
}
function galleryModel(host,g,value){
 const active=Number(value),chosen=Number.isInteger(active)&&active>=1&&active<=4?active:1;
 const curves=[{kind:'hyperbola',k:2,poles:[0]},{kind:'hyperbola',k:-2,poles:[0]},{kind:'line',k:.5,b:0},{kind:'line',k:-.5,b:2}],group=document.createElement('div');group.className='row';group.setAttribute('aria-label','Графики рисунка 56');
 for(let i=1;i<=curves.length;i++){
  const button=document.createElement('button');button.type='button';button.className='quiet';button.textContent=String(i);button.setAttribute('aria-label','Рассмотреть график '+i);button.setAttribute('aria-pressed',String(i===chosen));button.dataset.behaviorCandidate=String(i);
  button.onclick=()=>{const field=host.ownerDocument.getElementById('final-answer');if(!field||field.readOnly||field.disabled)return;field.value=String(i);field.dispatchEvent(new host.ownerDocument.defaultView.Event('input',{bubbles:true}));};group.append(button);
 }
 host.append(group);const q=M.parse(g.partial?.[0]),curve=curves[chosen-1],points=[];
 if(q){const x=q.n/q.d,y=curveValue(curve,x);if(Number.isFinite(y)){points.push([x,y,'']);boundNote(host,'На графике '+chosen+' при x='+M.answer(q)+' ордината '+Number(y.toFixed(3))+'.').dataset.behaviorTrial=String(y);}else boundNote(host,'При x=0 эта ветвь не определена.').dataset.behaviorTrial='excluded';}
 const svg=rootGraph({curves:[curve],points,xRange:[-4,4],yRange:[-4,4],label:'График '+chosen+' из четырёх схем'},'');svg.dataset.behaviorGallery=String(chosen);host.append(svg);boundNote(host,'График '+chosen+'. Кнопки 1–4 меняют черновой выбор. Ответ проверяется отдельно.');
}
function behaviorView(host,g,value){
 host.className='task-graphs quantity-model';const mode=g.mode;if(mode==='gallery')return galleryModel(host,g,value);
 const q=M.parse(g.partial?.[0]),curves=[],points=[],table=mode.endsWith('-table'),weather=mode==='river',tank=mode.startsWith('tank'),cubic=mode.startsWith('cubic'),abs=mode==='abs';
 const xRange=g.customNodes?[-2,g.customNodes.at(-1)[0]+2]:tank?[-4,155]:weather?[-.5,12.5]:cubic?[-3.5,3.5]:abs?[-6,6]:[-2,7],yRange=tank?[0,110]:weather?[-.5,7]:cubic?[-10,10]:abs?[-1,7]:[0,9];
 const nodes=g.customNodes|| (tank?[[0,20],[40,100],[60,100],[150,40]]:weather?riverReadings:null);
 if(table){const parts=String(value??'').split(';'),marks=[];g.xs.forEach((x,i)=>{const v=M.parse(parts[i]);if(v){marks.push([x,v.n/v.d]);points.push([x,v.n/v.d,'']);}});
  const complete=marks.length===g.xs.length&&parts.length===g.xs.length,exact=complete&&parts.every((raw,i)=>M.equal(raw,g.tableValues[i]));
  if(complete&&tank)curves.push({kind:'behavior-linear-points',nodes:marks,xs:g.xs});else if(exact)curves.push({kind:'behavior-function',mode,xs:g.xs});else if(marks.length>=2)curves.push({kind:'behavior-linear-points',nodes:marks,xs:marks.map(p=>p[0]),dashed:true});
  boundNote(host,exact?'Твои точки дают график указанной зависимости.':marks.length?'Твои точки отмечены. Пунктир помогает проверить порядок, а форму между точками задаёт формула.':'Введи ординаты по порядку. Каждая введённая точка появится на плоскости.').dataset.behaviorTable=exact?'exact':String(marks.length);
 }else{curves.push({kind:'behavior-function',mode,xs:nodes?.map(p=>p[0])||(cubic?[-3,-Math.sqrt(8/3),0,Math.sqrt(8/3),3]:[])});if(nodes)points.push(...nodes.map(([x,y])=>[x,y,'']));}
 if(abs&&Number.isFinite(g.level))curves.push({kind:'line',k:0,b:g.level,dashed:true});
 if(q){const x=q.n/q.d,y=g.customNodes?curveValue({kind:'behavior-linear-points',nodes:g.customNodes},x):behaviorHeight(mode,x);if(Number.isFinite(y)){if(!table)points.push([x,y,'']);const step=g.customNodes?(x<nodes[1][0]?'raise':x<=nodes[2][0]?'hold':'cool'):tank?tankTrial(x).stage:'';boundNote(host,'При '+(tank||weather?'t':'x')+'='+M.answer(q)+' '+(tank?'температура ':weather?'уровень ':'значение ')+Number(y.toFixed(3))+(tank?' °С':weather?' дм':'')+'.').dataset.behaviorTrial=step||String(Number(y.toFixed(6)));}else boundNote(host,'Выбранный аргумент вне указанного промежутка.').dataset.behaviorTrial='outside';}
 const svg=rootGraph({curves,points,xRange,yRange,axisLabels:tank?['t','p']:weather?['t','h']:['x','y'],xTickStep:tank?40:weather?2:undefined,yTickStep:tank?20:weather?1:undefined,gridStep:tank?20:undefined,label:tank?'Температура в градусах в зависимости от времени в минутах':weather?'Уровень реки в дециметрах по дням':'График функции с точками ученика'},'');host.append(svg);
 if(g.proposal)intervalNumberLine(host,{givenRows:[],proposal:g.proposal,points:[]},'');
}

function featureY(shape,k,b,x){
 switch(shape){
  case 'affine':case 'triangle':return k*x+b;
  case 'reciprocal':return x===0?NaN:k/x;
  case 'square':return k*x*x;
  case 'cube':return k*x*x*x;
  case 'sqrt':return k*Math.sqrt(x);
  case 'absolute':return k*Math.abs(x);
  case 'bounded-rational':return x*x/(x*x+1);
  default:return NaN;
 }
}
function featureAllowed(g,x){return Number.isFinite(x)&&(!g.segment||((g.leftOpen?x>g.segment[0]:x>=g.segment[0])&&x<=g.segment[1]))&&(g.shape!=='sqrt'||x>=0)&&(g.shape!=='reciprocal'||x!==0);}
function featureView(host,g,value){
 host.className='task-graphs quantity-model';const k=M.parse(g.k),b=M.parse(g.b),free=M.parse(g.partial?.[0]);
 const numeric=q=>q.n/q.d,canonical=[numeric(k),numeric(b)],building=g.mode==='build',two=['affine','triangle'].includes(g.shape);
 let proposed=building?(two?domainCoefficients(value,2)?.map(numeric):M.parse(value)?[numeric(M.parse(value)),0]:null):canonical;
 const curves=[],points=[],triangle=g.shape==='triangle',bounded=g.shape==='bounded-rational';
 if(g.constructionXs){
  proposed=null;const supplied=domainCoefficients(value,g.constructionXs.length);
  if(supplied){const y=supplied.map(numeric),twice=(a,b)=>BigInt(a.n)*BigInt(b.d)===2n*BigInt(b.n)*BigInt(a.d);g.constructionXs.forEach((x,i)=>points.push([x,y[i],'']));
   if(g.shape==='affine')proposed=[y[1]-y[0],y[0]];
   if(g.shape==='reciprocal'&&twice(supplied[0],supplied[1]))proposed=[y[0],0];
   if(g.shape==='square'&&y[1]===0&&M.equal(M.answer(supplied[0]),M.answer(supplied[2])))proposed=[y[0]/4,0];
   if(g.shape==='sqrt'&&y[0]===0&&twice(supplied[2],supplied[1]))proposed=[y[1],0];
   if(!proposed)boundNote(host,'Твои точки отмечены. Пока они не лежат на одной кривой заданного вида.').dataset.featureInconsistent='points';
  }
 }
 if(proposed){const [m,c]=proposed;const curve={kind:'feature-curve',shape:g.shape,k:m,b:c,segment:g.segment,poles:g.shape==='reciprocal'?[0]:[]};
  if(g.segment){const [l,r]=g.segment;curve.xs=[l,r];if(g.leftOpen)curve.holes=[[l,featureY(g.shape,m,c,l)]];else points.push([l,featureY(g.shape,m,c,l),'']);points.push([r,featureY(g.shape,m,c,r),'']);}
  curves.push(curve);
 }
 if(bounded)curves.push({kind:'line',k:0,b:1,dashed:true});
 let marker=null;
 if(free){const x=numeric(free),allowed=featureAllowed(g,x);
  if(allowed&&proposed){const y=featureY(g.shape,proposed[0],proposed[1],x);if(Number.isFinite(y)){marker=[x,y];const label=Number.isInteger(y)?String(y):String(Number(y.toFixed(3))).replace('.',',');boundNote(host,'При x='+M.answer(free)+' ордината '+(Number.isInteger(y)?'равна ':'приблизительно равна ')+label+'.').dataset.featureTrial=[x,y].join(';');}}
  else if(!allowed)boundNote(host,'При x='+M.answer(free)+' исходная функция не определена на указанной области.').dataset.featureTrial='excluded';
 }
 let windowX=triangle?[6,44]:g.mode==='identify'?[-2,3]:g.segment?[g.segment[0]-1,g.segment[1]+1]:[-6,6];
 let windowY=triangle?[30,110]:bounded?[-.2,1.3]:g.segment?[-10,16]:[-9,9];
 if(g.mode==='direction'&&g.shape==='square')windowX=[-5,1];if(g.mode==='direction'&&g.shape==='sqrt')windowX=[-1,8];
 if(g.mode==='identify'&&value){const options={'y=x−1':[1,-1],'y=1+x':[1,1],'y=2x−1':[2,-1],'y=1−2x':[-2,1]},trial=options[value];if(trial)curves.push({kind:'line',k:trial[0],b:trial[1],dashed:true});}
 const svg=rootGraph({curves,points,studentPoint:marker,xRange:windowX,yRange:windowY,axisLabels:['x',triangle?'P':'y'],label:triangle?'График периметра возможного треугольника':'График зависимости и выбранная абсцисса'},'');
 if(building&&proposed)svg.dataset.featureBuild=proposed.join(';');host.append(svg);
 if(building&&!proposed&&!points.length)boundNote(host,g.constructionXs?'Введи ординаты точек. На плоскости появится твоё построение.':'Введи коэффициент'+(two?'ы':'')+' в ответе. Здесь появится построенный тобой график.');
 if(triangle&&free){const x=numeric(free);if(featureAllowed(g,x)){const height=Math.sqrt(x*x-100),scale=Math.min(8,125/height),base=20*scale,top=142-height*scale;
  const tri=node('svg',{viewBox:'0 0 320 165',role:'img','aria-label':'Равнобедренный треугольник с основанием 20 см','data-feature-side':M.answer(free)});tri.append(node('polygon',{points:[[160-base/2,142],[160,top],[160+base/2,142]].map(v=>v.join(',')).join(' '),stroke:'#286456',fill:'#deeee5','stroke-width':3}),node('text',{x:160,y:163,'text-anchor':'middle','font-size':16},'20 см'),node('text',{x:164+base/4,y:(142+top)/2,'font-size':15},M.answer(free)+' см'));host.append(tri);}}
 if(g.proposal){boundNote(host,g.mode==='range'?'Твоя проекция на ось y':'Твоя проекция на ось x');intervalNumberLine(host,{givenRows:[],proposal:g.proposal,points:[]},'');}
}

function readingHeight(nodes,x){
 if(!Number.isFinite(x)||!Array.isArray(nodes)||nodes.length<2||x<nodes[0][0]||x>nodes.at(-1)[0])return NaN;
 const at=nodes.findIndex(p=>p[0]>=x);if(at===0||nodes[at][0]===x)return nodes[at][1];
 const ix=at-1,slope=i=>(nodes[i+1][1]-nodes[i][1])/(nodes[i+1][0]-nodes[i][0]);
 const tangent=i=>{if(i===0)return slope(0);if(i===nodes.length-1)return slope(i-1);const a=slope(i-1),b=slope(i);return a*b>0?2*a*b/(a+b):0;};
 const [l,low]=nodes[ix],[r,high]=nodes[at],width=r-l,t=(x-l)/width;
 return (2*t*t*t-3*t*t+1)*low+(t*t*t-2*t*t+t)*width*tangent(ix)+(-2*t*t*t+3*t*t)*high+(t*t*t-t*t)*width*tangent(at);
}
function absDomainTrial(mode,raw){
 const q=M.parse(raw);if(!q)return null;
 const abs=M.answer({...q,n:Math.abs(q.n)}),near=M.operation('subtract','2',raw),away=M.operation('add',raw,'1');
 let quantity,output=null,radical=false;
 if(mode==='abs-positive')quantity=M.operation('add',M.answer({...away,n:Math.abs(away.n)}),'4');
 if(mode==='abs-den')quantity=M.operation('subtract',abs,'2');
 if(mode==='abs-rad'){quantity=M.operation('subtract',abs,'1');radical=true;}
 if(mode==='abs-piece'){quantity=M.operation('subtract',M.answer({...near,n:Math.abs(near.n)}),M.answer(M.operation('multiply','3',raw)));radical=true;}
 if(!quantity)return null;
 const n=quantity.n/quantity.d,x=q.n/q.d,allowed=radical?n>=0:n!==0;
 if(allowed)output=mode==='abs-positive'?5/n:mode==='abs-den'?48/n:mode==='abs-rad'?x*x+Math.sqrt(n):Math.sqrt(n);
 return {quantity:M.answer(quantity),allowed,output,radical};
}
function graphReadingView(host,g,value){
 host.className='task-graphs quantity-model';const free=g.partial?.[0],trial=M.parse(free),answer=M.parse(value),mode=g.mode;
 if(mode==='square-area'||mode==='square-diagonal'){
  const svg=node('svg',{viewBox:'0 0 320 180',role:'img','aria-label':'Квадратная плитка вписана в квадрат со стороной, равной её диагонали'});
  svg.append(node('rect',{x:76,y:12,width:152,height:152,fill:'#f7eee1',stroke:'#745a36','stroke-width':2}),node('polygon',{points:'152,12 228,88 152,164 76,88',fill:'#cde6dc',stroke:'#17695a','stroke-width':3}),node('line',{x1:76,x2:228,y1:88,y2:88,stroke:'#355b5e','stroke-dasharray':'4 3'}));
  svg.append(node('text',{x:152,y:79,'text-anchor':'middle','font-size':17},trial&&trial.n>0?'d = '+M.answer(trial):'d'));
  if(trial&&trial.n>0){
   const d=trial.n/trial.d,ref=mode==='square-area'?12:16,radius=76*d/Math.max(d,ref),cx=152,cy=88;
   svg.append(node('polygon',{points:[[cx,cy-radius],[cx+radius,cy],[cx,cy+radius],[cx-radius,cy]].map(p=>p.join(',')).join(' '),fill:'none',stroke:'#96521c','stroke-width':3,'stroke-dasharray':'5 3','data-reading-square':M.answer(trial)}));
   boundNote(host,'Пунктир показывает твою плитку. Масштаб подобран для сравнения диагоналей.');
  }
  host.append(svg);
  if(trial&&trial.n>0){const area=functionValueAt({numerator:['0','0','1/2'],denominator:['1']},free);boundNote(host,'При выбранной диагонали '+M.answer(trial)+' см площадь плитки равна '+area+' см².').dataset.readingTrial=area;}
  if(answer&&mode==='square-diagonal'){const implied=functionValueAt({numerator:['0','0','1/2'],denominator:['1']},value);boundNote(host,'При предложенной диагонали площадь получилась бы '+implied+' см².').dataset.readingProposal=implied;}
  if(answer&&mode==='square-area')boundNote(host,'Предложенная площадь '+M.answer(answer)+' см². Проверь, равна ли она половине площади квадрата на диагонали.').dataset.readingProposal=M.answer(answer);
  return;
 }
 if(mode.startsWith('abs-')){
  const points=[],curve=mode==='abs-den'?{kind:'source-absolute-domain',mode,poles:[-2,2]}:{kind:'source-absolute-domain',mode};
  if(trial){const result=absDomainTrial(mode,free);if(result){const x=trial.n/trial.d;if(result.allowed)points.push([x,result.output,'']);const label=result.radical?'Подкоренное выражение':'Знаменатель';boundNote(host,'При x='+M.answer(trial)+'. '+label+' равно '+result.quantity+'. '+(result.allowed?'Подстановка разрешена.':'Подстановка запрещена.')).dataset.readingTrial=result.allowed?'allowed':'excluded';}}
  host.append(rootGraph({curves:[curve],points,xRange:[-6,6],yRange:mode==='abs-den'?[-25,25]:[-2,12],label:'Допустимые значения аргумента исходной функции'},''));
  if(g.proposal)intervalNumberLine(host,{givenRows:[],proposal:g.proposal,points:trial?[trial]:[]},'');return;
 }
 const weather=g.chart==='weather',nodes=g.nodes,curves=[{kind:'reading-profile',nodes,xs:nodes.map(p=>p[0])}],points=weather?nodes.map(([x,y])=>[x,y,'']):[[nodes[0][0],nodes[0][1],''],[nodes.at(-1)[0],nodes.at(-1)[1],'']];
 const rawHeight=x=>weather?(nodes.find(v=>v[0]===x)?.[1]??NaN):readingHeight(nodes,x);
 const heightLabel=v=>String(Math.round(v*100)/100).replace('.',',');
 if(trial){const x=trial.n/trial.d,y=rawHeight(x);if(Number.isFinite(y)){points.push([x,y,'']);boundNote(host,(weather?'В полдень '+M.answer(trial)+' мая: ':'При x='+M.answer(trial)+' по графику y≈')+heightLabel(y)+(weather?' мм рт. ст.':'.')).dataset.readingTrial=heightLabel(y);}else{boundNote(host,weather?'В этой точке нет полуденного измерения за целый день от 1 до 10.':'Эта абсцисса вне отрезка [−6; 5].').dataset.readingTrial='outside';}}
 if(mode==='preimage')curves.push({kind:'line',k:0,b:g.target,dashed:true});
 let proposed=null;
 if(mode==='ordinate'&&answer)proposed=[g.argument,answer.n/answer.d];
 if(mode==='argmax'&&answer){const x=answer.n/answer.d,y=rawHeight(x);if(Number.isFinite(y))proposed=[x,y];}
 if((mode==='min'||mode==='max')&&answer)curves.push({kind:'line',k:0,b:answer.n/answer.d,dashed:true});
 if(mode==='preimage'&&g.xs){for(const q of g.xs){const x=q.n/q.d;if(x>=-6&&x<=5)points.push([x,g.target,'']);}}
 const measureRange=weather?[2*Math.floor((Math.min(...nodes.map(p=>p[1]))-1)/2),2*Math.ceil((Math.max(...nodes.map(p=>p[1]))+1)/2)]:[-5,7];
 const svg=rootGraph({curves,points,studentPoint:proposed,xRange:weather?[0,11]:[-7,6],yRange:measureRange,axisLabels:weather?['день','p']:['x','g'],xTickStep:weather?2:1,yTickStep:weather?4:2,gridStep:1,label:weather?'Давление в полдень по дням мая':'Схема функции на конечном отрезке с максимумом и минимумом'},'');host.append(svg);
 if(proposed)boundNote(host,'Квадрат показывает твоё предложение ('+heightLabel(proposed[0])+'; '+heightLabel(proposed[1])+').').dataset.readingProposal=proposed.join(';');
 if(mode==='range'&&g.proposal)intervalNumberLine(host,{givenRows:[],proposal:g.proposal,points:[]},'');
 if(weather)boundNote(host,'По горизонтали — день мая, по вертикали — давление, мм рт. ст. Точки показывают полуденные измерения.');
}

function domainCoefficients(raw,count){
 const parts=String(raw??'').split(';');if(parts.length!==count)return null;
 const values=parts.map(v=>M.parse(v));return values.every(Boolean)?values:null;
}
function familyDomain(raw){
 const fields=domainCoefficients(raw,4);if(!fields)return null;
 const [a,b,c,d]=fields.map(q=>M.answer(q));
 if(M.equal(c,'0'))return {fields:[a,b,c,d],domain:M.equal(d,'0')?'empty':'all',cut:null};
 const cut=functionValueAt({numerator:['0',d],denominator:[c]},'-1');
 return {fields:[a,b,c,d],domain:'except',cut};
}
function domainAt(g,raw){
 const x=M.parse(raw);if(!x)return null;
 if(g.case==='radical'){
  const radicand=functionValueAt({numerator:[String(g.b),String(g.k)],denominator:['1']},raw),r=M.parse(radicand);
  if(!r)return null;
  const y=Math.sqrt(r.n/r.d);return {allowed:r.n>=0,reason:'radical',quantity:radicand,y:Number.isFinite(y)?y:null};
 }
 const den=functionValueAt({numerator:g.denominator,denominator:['1']},raw),output=functionValueAt(g,raw),v=M.parse(output);
 return {allowed:den!==null&&!M.equal(den,'0'),reason:'denominator',quantity:den,output,y:v?v.n/v.d:null};
}
function functionDomainView(host,g,value){
 host.className='task-graphs quantity-model';
 const free=g.partial?.[0],x=M.parse(free),mode=g.case;
 if(mode==='escalator'){
  const positive=x&&x.n>0,local=positive?Number(x.n/x.d):0,baseT=g.mode==='depth'?135:g.mode==='time'?160:1;
  const val=M.parse(value),actual=g.mode==='time'?60:g.mode==='depth'?135*3/8:3/8;
  const svg=node('svg',{viewBox:'0 0 320 170',role:'img','aria-label':'Наклонный ход и вертикальная глубина при угле 30 градусов'});
  const top=[36,25],bottom=[256,152];svg.append(node('path',{d:'M36 25 V152 H256 Z',fill:'#edf5ef',stroke:'#397769','stroke-width':3}),node('path',{d:'M36 140 H48 V152',fill:'none',stroke:'#485a56'}),node('text',{x:192,y:146,'font-size':16},'30°'),node('text',{x:40,y:100,'font-size':15},'h'),node('text',{x:122,y:59,'font-size':15},'0,75t'));
  if(positive){const proj=local/Math.max(local,baseT),px=top[0]+(bottom[0]-top[0])*proj,py=top[1]+(bottom[1]-top[1])*proj;svg.append(node('circle',{cx:px,cy:py,r:5,fill:'#17695a','data-domain-time':M.answer(x)}),node('line',{x1:top[0],x2:px,y1:py,y2:py,stroke:'#6f5a38','stroke-dasharray':'4 3'}));}
  host.append(svg);
  if(positive){const h=functionValueAt({numerator:['0','3/8'],denominator:['1']},free),s=functionValueAt({numerator:['0','3/4'],denominator:['1']},free);boundNote(host,'За '+M.answer(x)+' с лента пройдёт '+s+' м. Вертикальный спуск равен '+h+' м.').dataset.domainTrial='time';}
  if(val){
   const exact=g.mode==='time'?functionValueAt({numerator:['0','3/8'],denominator:['1']},value):M.answer(val),r=M.parse(exact);
   if(r){const shown=r.n/r.d,range=Math.max(actual,Math.abs(shown),1),base=133,scale=94/range;
    svg.append(node('line',{x1:275,x2:275,y1:base,y2:base-actual*scale,stroke:'#17695a','stroke-width':5}),node('line',{x1:290,x2:290,y1:base,y2:Math.min(162,base-shown*scale),stroke:'#9b4d14','stroke-width':5,'data-domain-proposal':exact}),node('line',{x1:265,x2:305,y1:base,y2:base,stroke:'#5f655e'}));
    boundNote(host,'Справа зелёный отрезок — требуемая глубина, охристый — твоя. '+(g.mode==='time'?'При предложенном времени глубина составила бы '+exact+' м.':'По твоей записи получается '+exact+' м'+(g.mode==='rate'?' за секунду.':'.')));
   }
  }
  return;
 }
 let graph=g,curves=[],points=[],poles=g.poles||[];
 const number=v=>{const q=M.parse(v);return q?q.n/q.d:null;};
 if(mode==='family'){
  const family=familyDomain(value);
  if(!family){boundNote(host,'Введи четыре коэффициента. Твоя дробь и её область появятся здесь.');return;}
  const [a,b,c,d]=family.fields;graph={case:'quotient',numerator:[b,a],denominator:[d,c]};poles=family.cut===null?[]:[number(family.cut)];
  const description=family.domain==='empty'?'Знаменатель твоей формулы равен нулю при каждом x.':family.domain==='all'?'Твой знаменатель — ненулевая константа. Разрешены все x.':'Твой знаменатель равен нулю при x='+family.cut+'. В этой точке исходная дробь не существует.';
  boundNote(host,description).dataset.domainFamily=family.domain;
  if(family.domain==='empty')return;
 }
 const plotting=mode==='line-hole'||mode==='reciprocal-hole',construction=plotting?domainCoefficients(value,3):null;
 if(plotting){
  if(construction){const [k,b,h]=construction.map(q=>q.n/q.d);if(mode==='line-hole')curves.push({kind:'line',k,b,holes:[[h,k*h+b]]});else curves.push({kind:'quotient',numerator:[k,b],denominator:[0,1],poles:[0],holes:h===0?[]:[[h,k/h+b]]});}
 }else if(mode==='radical'){curves.push({kind:'sqrt-affine',k:g.k,b:g.b});}
 else{const num=graph.numerator.map(number),den=graph.denominator.map(number);const holes=[];if(mode==='family'&&poles.length===1){const f=familyDomain(value),[a,b,c]=f.fields,top=functionValueAt({numerator:[b,a],denominator:['1']},f.cut);if(M.equal(top,'0'))holes.push([poles[0],number(a)/number(c)]);}curves.push({kind:'quotient',numerator:num,denominator:den,poles,holes});}
 if(x){const trial=domainAt(graph,free);if(trial){const info=trial.reason==='radical'?'Подкоренное выражение равно '+trial.quantity+'. ': 'Знаменатель равен '+trial.quantity+'. ';boundNote(host,'При x='+M.answer(x)+'. '+info+(trial.allowed?'Подстановка разрешена.':'Такое значение x запрещено.')).dataset.domainTrial=trial.allowed?'allowed':'excluded';if(trial.allowed&&trial.y!==null)points.push([x.n/x.d,trial.y,'']);}}
 if(plotting&&!construction)boundNote(host,'Испытай свой x. Затем введи коэффициенты и абсциссу отверстия — появится твой график.');
 host.append(rootGraph({xRange:[-10,10],yRange:[-8,8],stepX:4,stepY:4,gridX:2,gridY:2,curves,points},''));
 if(g.proposal)intervalNumberLine(host,{mode:'operation',givenRows:[],proposal:g.proposal,points:x?[x]:[]},'');
}

function functionValueAt(g,raw){
 if(!M.parse(raw))return null;
 const expr=coeff=>coeff.slice().reverse().reduce((sum,c)=>['+',['*',sum,'x'],c],'0');
 const t=sourceFractionTrial({symbols:['x'],original:['/',expr(g.numerator),expr(g.denominator)],reduced:'0'},raw,true);
 return t.original;
}
function functionSourceView(host,g,value){
 host.className='task-graphs quantity-model';
 const chosen=g.partial?.[0],trial=M.parse(chosen),points=[];
 const cfg=cs=>cs.map(k=>{const q=M.parse(k);return q.n/q.d;});
 const curve={kind:'quotient',numerator:cfg(g.numerator),denominator:cfg(g.denominator),poles:g.poles||[]},curves=[curve];
 if(g.mode==='inverse')curves.push({kind:'line',k:0,b:g.target,dashed:true});
 const show=(raw,role)=>{
  const x=M.parse(raw);if(!x)return;
  const output=functionValueAt(g,raw);
  if(output===null){boundNote(host,'При x = '+M.answer(x)+' знаменатель равен нулю, поэтому точка графика отсутствует.').dataset.functionValue='undefined';return;}
  const xNum=x.n/x.d,yNum=curveValue(curve,xNum);
  if(role==='trial')points.push([xNum,yNum]);
  const p=boundNote(host,'При x = '+M.answer(x)+' значение функции равно '+output+'.');
  p.dataset.functionValue=output;
  if(role==='inverse'||role==='zero')p.dataset.inverseMatch=output===String(g.target)?'yes':'no';
 };
 if(trial)show(chosen,'trial');
 if(g.mode==='inverse'&&M.parse(value))show(value,'inverse');
 if(g.mode==='zeros'&&g.roots)for(const r of g.roots)show(r,'zero');
 const proposed=g.mode==='value'&&M.parse(value),arg=M.parse(g.at),proposal=proposed&&arg?[arg.n/arg.d,proposed.n/proposed.d]:null;
 if(g.mode==='inverse'&&M.parse(value)){const x=M.parse(value),xx=x.n/x.d,yy=curveValue(curve,xx);points.push([xx,yy]);}
 if(g.mode==='zeros'&&g.roots)for(const raw of g.roots){const x=M.parse(raw);if(x){const xx=x.n/x.d,yy=curveValue(curve,xx);if(Number.isFinite(yy))points.push([xx,yy]);}}
 const graph=rootGraph({curves,points,studentPoint:proposal,xRange:g.xRange,yRange:g.yRange,label:'График функции, испытанные аргументы и предложенный ответ.'},'');
 host.append(graph);
 if(proposal)boundNote(host,'Квадрат — твоя точка ('+M.answer(arg)+'; '+M.answer(proposed)+'). Посмотри, лежит ли она на графике.');
 if(g.mode==='sum'){
  const table=document.createElement('table');table.className='values-table';
  const tableRows=[['x',...g.inputs],['Твоё φ(x)',...g.inputs.map((_,i)=>g.partial?.[i+1]||'—')]];
  for(const cells of tableRows){const row=table.insertRow();for(const v of cells)row.insertCell().textContent=String(v);}host.append(table);
 }else if(!trial&&!proposal)boundNote(host,g.mode==='inverse'?'Пунктир — заданный уровень y. Найди абсциссу пересечения с прямой.':'Подставь собственный x на первом шаге и проверь, определено ли значение.');
}

function appliedBoundsView(host,g,value){
 host.className='task-graphs quantity-model';const raw=g.partial?.[0],q=M.parse(raw);
 const say=(text,state)=>{const p=boundNote(host,text);if(state)p.dataset.appliedBounds=state;};
 if(g.proposal)intervalNumberLine(host,{mode:'operation',givenRows:[],proposal:g.proposal,points:q?[q]:[]},value);
 if(!q){say('Выбери собственное значение на первом шаге. Модель проверит его по исходным данным.');return;}
 const v=q.n/q.d,fmt=expr=>sourceFractionTrial({symbols:['v'],original:expr,reduced:'0'},raw,true).original;
 const diff=(n,d=1)=>BigInt(q.n)*BigInt(d)-BigInt(n)*BigInt(q.d);
 if(g.mode==='load'){
  if(q.d!==1||v<0||v>12){say('Груз состоит из 12 штук. Количество железных должно быть целым от 0 до 12.','domain');return;}
  const svg=node('svg',{viewBox:'0 0 280 82',role:'img','aria-label':'Двенадцать заготовок, различаемые цветом и буквами Ж или М'});
  for(let i=0;i<12;i++){const x=4+(i%6)*46,y=3+Math.floor(i/6)*38,iron=i<v;svg.append(node('rect',{x,y,width:36,height:28,rx:3,fill:iron?'#407268':'#945625'}),node('text',{x:x+18,y:y+18,fill:'white','text-anchor':'middle','font-size':13},iron?'Ж':'М'));}
  host.append(svg);say('Железных '+v+', медных '+(12-v)+'. Масса '+(2400+300*v)+' кг при пределе 4000 кг.',v<=5?'yes':'no');return;
 }
 if(g.mode==='triangle'){
  if(q.d!==1||v<=0){say('Выбери положительное целое число сантиметров.','domain');return;}
  if(v<=10){say('Две боковые стороны суммарно '+(2*v)+' см, а основание 20 см. Невырожденный треугольник не складывается.','degenerate');return;}
  const h=Math.sqrt((v-10)*(v+10)),s=Math.min(10,90/h),svg=node('svg',{viewBox:'0 0 281 115',role:'img','aria-label':'Равнобедренный треугольник с основанием 20 и двумя выбранными сторонами'});
  svg.append(node('polygon',{points:(140-10*s)+',99 '+(140+10*s)+',99 140,'+(99-h*s),fill:'#e8f1ee',stroke:'#286a5d','stroke-width':2}));host.append(svg);
  say('Боковые стороны по '+v+' см, основание 20 см. Периметр '+(2*v+20)+' см при пределе 46 см.',v<=13?'yes':'no');return;
 }
 if(v<=0){say('Скорость или длина дневного перехода должна быть положительной.','domain');return;}
 if(g.mode==='hike'){
  if(diff(5)<=0n){say('После уменьшения на 5 км дневной путь должен остаться положительным.','domain');return;}
  const up=fmt(['*','6',['+','v','5']]),down=fmt(['*','8',['-','v','5']]);
  say('Шесть более длинных переходов дают '+up+' км, восемь коротких — '+down+' км. Первый путь должен превысить 90, второй быть меньше 90.',diff(10)>0n&&diff(65,4)<0n?'yes':'no');return;
 }
 if(g.mode==='train'){
  if(diff(60)<=0n){say('По условию вторая скорость выше 60 км/ч.','domain');return;}
  const time=fmt(['/','60','v']),mean=fmt(['/', ['*','120','v'], ['+','60','v']]);
  const svg=node('svg',{viewBox:'0 0 292 80',role:'img','aria-label':'Два равных участка по 60 км, под каждым время на него'});
  [[8,'60 км','1 ч'],[150,'60 км',time+' ч']].forEach(([x,km,hrs],i)=>{svg.append(node('rect',{x,y:12,width:134,height:20,fill:i?'#925224':'#176e62'}),node('text',{x:x+67,y:26,fill:'white','text-anchor':'middle','font-size':12},km));if(hrs.length<15)svg.append(node('text',{x:x+67,y:52,'text-anchor':'middle','font-size':13},hrs));});host.append(svg);
  say('Берём по 60 км на каждую половину. Времена 1 ч и '+time+' ч. Частное всего пути 120 км и суммы времён равно '+mean+' км/ч.',diff(90)<=0n?'yes':'no');return;
 }
 const motor=g.mode==='motor',slow=motor?12:4,gap=motor?20:8,finish=motor?60:24;
 const svg=node('svg',{viewBox:'0 0 300 84',role:'img','aria-label':motor?'Схема дороги: старт в деревне, ферма и станция':'Схема дороги: точка старта, положение первого через два часа и город'});
 const pos=z=>19+260*z/finish;svg.append(node('line',{x1:19,x2:279,y1:44,y2:44,stroke:'#526b65','stroke-width':2}));
 [[0,motor?'Деревня':'Старт'],[gap,motor?'Ферма':'8 км'],[finish,motor?'Станция':'Город']].forEach(([x,s],i)=>{svg.append(node('circle',{cx:pos(x),cy:44,r:3,fill:'#345750'}),node('text',{x:pos(x),y:65,'text-anchor':i===0?'start':i===2?'end':'middle','font-size':12},s));});
 if(diff(slow)<=0n){host.append(svg);say('Стартующий сзади движется не быстрее того, кто уже впереди. На схеме до конца дороги они не встретятся.','no');return;}
 const time=fmt(['/',String(gap),['-','v',String(slow)]]);
 const dist=fmt(['/', ['*',String(gap),'v'], ['-','v',String(slow)]]);
 const meet=gap*v/(v-slow),limit=motor?18:6;const status=diff(limit)>0n?'yes':diff(limit)===0n?'boundary':'no';
 if(status!=='no')svg.append(node('path',{d:'M'+pos(meet)+' 42 l-4 -10 h8 z',fill:'#9b4a1e','data-meeting':'on-road'}));host.append(svg);
 say('Встреча через '+time+' ч от старта догоняющего, в '+dist+' км от его старта. '+(status==='yes'?'Это раньше конечного пункта.':status==='boundary'?'Это ровно в конечном пункте; по условию нужно раньше.':'Эта точка дальше конечного пункта.'),status);
}

function solutionAudit(host,g,value){
 host.className='task-graphs quantity-model';
 const q=M.parse(g.partial?.[0]);
 if(g.mode==='function')signGraph(host,g,q);
 if(q){
  const r=linearTrial(g,M.answer(q));
  if(g.mode==='abs'){
   const zero=r.sign==='=',positive=r.sign==='>',ratio=g.absMode.startsWith('ratio');
   if(ratio&&zero)boundNote(host,'Аргумент равен нулю. Знаменатель обнуляется, поэтому отношение не определено.').dataset.modulusProbe='undefined';
   else{
    const holds=g.absMode==='same'?positive||zero:g.absMode==='opposite'?!positive:g.absMode==='ratio-plus'?positive:!positive;
    boundNote(host,'При m = '+M.answer(q)+' аргумент равен '+r.left+'. '+(ratio?'Отношение модуля к аргументу равно '+(positive?'1':'−1')+'. ':'Модуль равен '+r.left.replace(/^-/,'')+'. ')+(holds?'Равенство выполняется.':'Равенство не выполняется.')).dataset.modulusProbe=holds?'yes':'no';
   }
  }else if(g.mode==='root')boundNote(host,'При '+g.variable+' = '+M.answer(q)+' корень x = '+g.formula+' равен '+r.left+'. Требуемый знак '+g.operator+' 0 '+(r.holds?'выполняется.':'не выполняется.')).dataset.rootSign=r.holds?'yes':'no';
  else{
   const valid=g.mode!=='natural'||q.d===1&&q.n>0;
   const label=g.mode==='function'?'Ордината равна '+r.left+', сравниваем её с нулём.':'Левая часть '+r.left+', правая '+r.right+'.';
   boundNote(host,'При '+g.variable+' = '+M.answer(q)+': '+label+' '+(valid?(r.holds?'Условие выполняется.':'Исходный знак не выполняется.'):'Подстановка не является натуральным числом.')).dataset.solutionProbe=r.holds&&valid?'yes':'no';
  }
 }else boundNote(host,'На первом шаге выбери число и испытай его в исходной записи.');
 if(g.mode==='natural'&&g.selected){
  for(const v of g.selected){const t=linearTrial(g,M.answer(v)),valid=v.d===1&&v.n>0;
   boundNote(host,'Твой элемент '+M.answer(v)+': '+(!valid?'не натуральный.':t.holds?'подходит.':'не выполняет неравенство.')).dataset.naturalProposal=t.holds&&valid?'yes':'no';}
 }
 if(g.proposal&&g.mode!=='function')intervalNumberLine(host,{mode:'operation',givenRows:[],proposal:g.proposal,points:q?[q]:[]},value);
}

function intervalSetReview(host,g,value){
 host.className='task-graphs quantity-model';
 const entered=g.trialStep===null?'':g.partial?.[g.trialStep];
 const raw=['witness','surd'].includes(g.mode)&&String(value||'').trim()?value:entered;
 const q=M.parse(raw),word=condition=>condition?'да':'нет';
 if(g.mode==='integer-positive'||g.mode==='prime-odd'){
  if(!q){boundNote(host,'Предложи число на первом шаге, чтобы проверить оба признака.');return;}
  if(!withinBounds(raw,[['-100','100',true]])){boundNote(host,'Для наглядной подстановки выбери число от −100 до 100.');return;}
  const [one,two]=setProbe(g.mode,q),both=g.operation==='intersection',names=g.mode==='integer-positive'?['Целое','Положительное']:['Простое','Нечётное натуральное'];
  for(const [i,flag] of [one,two].entries())boundNote(host,names[i]+' число: '+word(flag)+'.').dataset.predicate=String(i+1)+'-'+word(flag);
  const inResult=both?one&&two:one||two;boundNote(host,'Число '+M.answer(q)+(inResult?' входит':' не входит')+' в '+(both?'пересечение.':'объединение.')).dataset.setResult=word(inResult);return;
 }
 const rows=g.rows||[];
 if(g.mode==='surd'){
  intervalNumberLine(host,{mode:'operation',givenRows:rows,points:q?[q]:[],surd:g.radicand,distinguishSurd:true},value);
  if(q){
   const square=sourceFractionTrial({original:['^','x','2'],reduced:'0',symbols:['x']},raw,true).original;
   boundNote(host,'Твоя точка '+M.answer(q)+', её квадрат '+square+'. '+(betweenSurd(raw,g)?'Она строго между корнем и целой границей.':'Сверь знак числа, положение относительно целой границы и квадрат с подкоренным числом.')).dataset.surdWitness=word(betweenSurd(raw,g));
  }else boundNote(host,'Укажи свою положительную рациональную точку между целым числом и корнем.');
  return;
 }
 intervalNumberLine(host,{mode:'operation',givenRows:rows,points:q?[q]:[]},value);
 if(g.mode==='endpoints'){boundNote(host,'Закрашенная точка входит, пустая исключена. Конечная граница служит крайним элементом только тогда, когда она входит.');return;}
 if(!q){boundNote(host,'Введи рациональную подстановку на шаге опыта.');return;}
 if(g.mode==='witness'){
  const good=withinBounds(raw,g.limits);
  boundNote(host,'Точка '+M.answer(q)+(isInAxis(rows[0],q)?' входит':' не входит')+' в исходный промежуток. '+(good?'Она лежит между исходным числом и открытым концом.':'Испытай число между '+g.pivot+' и открытым концом.')).dataset.intervalWitness=word(good);return;
 }
 const [one,two,claim]=rows.map(row=>isInAxis(row,q)),included=g.operation==='intersection'?one&&two:one||two;
 boundNote(host,'В первом множестве: '+word(one)+'. Во втором: '+word(two)+'. Результат операции: '+word(included)+'. В правой части равенства: '+word(claim)+'.').dataset.operationProbe=included===claim?'agrees':'counterexample';
}

function geometryBoundView(host,g,value){
 host.className='task-graphs quantity-model';
 const raw=g.partial?.[0],valid=withinBounds(raw,g.bounds);
 if(raw&&!valid)boundNote(host,'Значение вышло за исходные границы. Круглые скобки исключают концы промежутка.').dataset.boundTrial='outside';
 if(!raw)boundNote(host,'На первом шаге введи свои исходные значения в указанном порядке.');
 if(valid){
  const vars=g.symbols,c=g.coef;
  const expr=g.operation==='pair'?['+',['*',c[0],vars[0]],['*',c[1],vars[1]]]:['+',[g.operation==='affine'?'*':'/',c[0],vars[0]],c[1]];
  const trial=sourceFractionTrial({symbols:vars,original:expr,reduced:'0'},raw,true);
  if(g.mode==='triangle-mid'||g.mode==='trapezoid-mid'){
   const data=raw.split(';').map(u=>M.parse(u)).map(q=>q.n/q.d);
   drawMidsegment(host,g.mode,g.mode==='triangle-mid'?0:data[0],data[data.length-1]);
   boundNote(host,'Коричневый отрезок соединяет середины боковых сторон. Его длина при твоих значениях равна '+trial.original+'.').dataset.boundTrial=trial.original;
  }else boundNote(host,'Значение выражения при твоей подстановке равно '+trial.original+'. Сопоставь результат с предложенными границами.').dataset.boundTrial=trial.original;
 }
 if(g.proposal)intervalNumberLine(host,{mode:'operation',givenRows:[],proposal:g.proposal,points:[]},value);
}
function geometryProof(host,g,raw,vals){
 const nums=vals.map(v=>v.n/v.d),[a,b,c]=nums;
 const exact=expr=>sourceFractionTrial({symbols:g.symbols,original:expr,reduced:'0'},raw,true).original;
 const svg=node('svg',{viewBox:'0 0 292 126',role:'img'});
 if(g.mode==='triangle'){
  const top=Math.max(a,b,c),A=a/top,B=b/top,C=c/top,x=(A*A+B*B-C*C)/(2*A),y=Math.sqrt(Math.max(0,B*B-x*x));
  const low=Math.min(0,x),high=Math.max(A,x),scale=Math.min(244/(high-low),96/Math.max(y,1e-30));
  const px=v=>146+(v-(low+high)/2)*scale;
  svg.setAttribute('aria-label','Треугольник с тремя заданными сторонами; a — основание');
  svg.append(node('polygon',{points:px(0)+',105 '+px(A)+',105 '+px(x)+','+(105-y*scale),fill:'#edf6f3',stroke:'#275e57','stroke-width':2}));
  svg.append(node('text',{x:(px(0)+px(A))/2,y:122,'text-anchor':'middle'},'a'));host.append(svg);
  const p=['/',['+',['+','a','b'],'c'],'2'];
  boundNote(host,'Полупериметр '+exact(p)+'. Он больше сторон a, b, c соответственно на '+g.symbols.map(v=>exact(['-',p,v])).join('; ')+'.').dataset.proofComparison='>';return;
 }
 if(g.mode==='equal-perimeter'){
  const s=(a+b)/2,scale=Math.min(114/Math.max(a,s),96/Math.max(b,s));
  svg.setAttribute('aria-label','Прямоугольник и равнопериметрический квадрат в одном масштабе');
  [[12,a,b],[160,s,s]].forEach(([x,w,h],i)=>svg.append(node('rect',{x,y:104-h*scale,width:w*scale,height:h*scale,fill:i?'#fff2d9':'#edf6f3',stroke:i?'#894418':'#275e57','stroke-width':2})));
  host.append(svg);boundNote(host,'Площадь прямоугольника '+exact(['*','a','b'])+', равнопериметрического квадрата '+exact(['^',['/',['+','a','b'],'2'],'2'])+'.').dataset.proofComparison=compareRationals(vals[0],vals[1])===0n?'=':'>';return;
 }
 if(g.mode==='largest'){
  const delta=['/',['*',['-','a','b'],['-','a','c']],'a'],d=['/',['*','b','c'],'a'];
  boundNote(host,'Четвёртый член d = '+exact(d)+'. Разность (a+d)−(b+c) равна '+exact(delta)+'.').dataset.proofComparison=exact(delta)==='0'?'=':'>';return;
 }
 const equal=exact(['-',['*','a',['^','c','2']],'b'])==='0';
 const fmt=v=>v.toLocaleString('ru-RU',{maximumSignificantDigits:8});
 boundNote(host,'Слагаемые ac = '+exact(['*','a','c'])+' и b/c = '+exact(['/','b','c'])+'. Их сумма '+exact(['+',['*','a','c'],['/','b','c']])+', удвоенное геометрическое среднее ≈ '+fmt(2*Math.sqrt(a*b))+'. '+(equal?'Слагаемые равны.':'Слагаемые различны, поэтому оценка строгая.')).dataset.proofComparison=equal?'=':'>';
}

function proofReviewModel(host,g){
 host.className='task-graphs quantity-model';
 const raw=g.trial||'',good=admissibleSample(raw,g.domain,g.symbols.length);
 if(!raw){boundNote(host,'Выбери числа на первом шаге. Для полного доказательства затем обоснуй знак при всех допустимых значениях.');return;}
 if(!good){boundNote(host,{'triangle-sides':'Все стороны должны быть положительными, каждая меньше суммы двух других.','strict-max':'Нужны положительные числа, причём a строго больше b и c.','weak-max':'Нужны положительные числа, причём a не меньше b и c.',positive:'Все введённые числа должны быть положительными.','root-sum-one':'Нужны три числа с суммой 1; каждое не меньше −1/4.','above-one':'Для этой задачи a должно быть строго больше 1.'}[g.domain]).dataset.proofDomain='invalid';return;}
 const vals=String(raw).split(';').map(s=>M.parse(s)),nums=vals.map(v=>v.n/v.d),fmt=v=>v.toLocaleString('ru-RU',{maximumSignificantDigits:8});
 if(['triangle','equal-perimeter','am-gm','largest'].includes(g.mode)){geometryProof(host,g,raw,vals);return;}
 let left,right,relation,note;
 if(g.mode==='fixed-radical-а'||g.mode==='fixed-radical-б'){
  const k=nums[0],first=g.mode==='fixed-radical-а';
  left=k*(first?Math.sqrt(7)+2*Math.sqrt(5):4*Math.sqrt(6)+2);
  right=k*(first?2+Math.sqrt(35):2*Math.sqrt(3)+4*Math.sqrt(2));
  relation=first?'<':'>';note='Твой положительный множитель растягивает обе полосы. Точный знак устанавливает разложение разности, а не округлённые длины.';
 }else if(g.mode==='four-roots'){
  const [a,b,c,d]=nums;left=Math.sqrt((a+c)*(b+d));right=Math.sqrt(a*b)+Math.sqrt(c*d);
  const [p,q,r,s]=vals;const equal=BigInt(p.n)*BigInt(s.n)*BigInt(q.d)*BigInt(r.d)===BigInt(q.n)*BigInt(r.n)*BigInt(p.d)*BigInt(s.d);
  relation=equal?'=':'>';note=equal?'Здесь ad = bc, квадрат разности корней равен нулю.':'Здесь ad ≠ bc, поэтому квадрат разности корней положителен.';
 }else if(g.mode==='three-roots'){
  left=nums.reduce((sum,v)=>sum+Math.sqrt(1+4*v),0);right=5;relation='<';note='По отдельности сравни √(1+4t) с 1+2t. Каждая разность квадратов равна 4t². Все три t одновременно нулём при сумме 1 быть не могут.';
 }else{
  const [a]=nums;left=1/Math.sqrt(a);right=2/(Math.sqrt(a+1)+Math.sqrt(a-1));relation='<';note='Сопряжённая сумма положительна. Её квадрат меньше 4a, так как √(a²−1) < a. При близких числах округлённые записи могут совпасть.';
 }
 const svg=node('svg',{viewBox:'0 0 310 100',role:'img','aria-label':'Длины отрезков пропорциональны численным значениям сторон при твоей подстановке.'});
 const top=Math.max(left,right,1e-100);for(const [i,v]of [left,right].entries()){const y=28+i*40,end=23+244*v/top,color=i?'#925323':'#087267';svg.append(node('line',{x1:23,x2:280,y1:y,y2:y,stroke:'#d7dedb'}),node('line',{x1:23,x2:end,y1:y,y2:y,stroke:color,'stroke-width':5}),node('text',{x:23,y:y-7,'font-size':12},i?'Правая сторона':'Левая сторона'),i?node('rect',{x:end-3,y:y-3,width:6,height:6,fill:color}):node('circle',{cx:end,cy:y,r:4,fill:color}));}host.append(svg);
 const line=document.createElement('p');line.className='small';line.dataset.proofComparison=relation;line.textContent='При твоих значениях левая сторона ≈ '+fmt(left)+', правая ≈ '+fmt(right)+'.';host.append(line);boundNote(host,note);
}

function systemReviewView(host,g,value){
 host.className='task-graphs quantity-model';
 const q=M.parse(g.partial?.[0]),say=(text,key,v)=>{const p=boundNote(host,text);if(key)p.dataset[key]=String(v);};
 if(g.proposal)intervalNumberLine(host,{mode:'operation',givenRows:[],proposal:g.proposal,points:[]},value);
 if(!q){say({parameters:'Испытай параметр. Два корня будут отмечены разными знаками.',domains:'Подставь своё число, чтобы отдельно проверить корень и знаменатель.',natural:'Испытай натуральное n и проверь делимость 12.',formula:'Выбери своё положительное число для числовой проверки формулы.',ride:'Испытай положительную скорость в гору. Модель рассчитает времена обоих участков.'}[g.mode]);return;}
 const n=BigInt(q.n),d=BigInt(q.d),x=q.n/q.d,fmt=v=>v.toLocaleString('ru-RU',{maximumSignificantDigits:8});
 function fraction(a,b){let c=a<0n?-a:a,e=b;while(e){const t=c%e;c=e;e=t;}a/=c;b/=c;return String(a)+(b===1n?'':'/'+b);}
 if(g.mode==='parameters'){
  const cfg=g.settings||(g.which===995?{coefficient:-1,offset:0,radius:2,low:-6,high:6}:{coefficient:3,offset:0,radius:4,low:null,high:0});
  const mid=BigInt(cfg.coefficient)*n+BigInt(cfg.offset)*d,rad=BigInt(cfg.radius),roots=[mid-rad*d,mid+rad*d];
  const inside=(cfg.low===null||roots[0]>BigInt(cfg.low)*d)&&(cfg.high===null||roots[1]<BigInt(cfg.high)*d);
  const svg=node('svg',{viewBox:'0 0 306 110',role:'img','aria-label':'Положение двух корней на оси x и границы условия'}),limit=Math.max(10,Math.abs(cfg.low||0)+4,Math.abs(cfg.high)+4),px=u=>153+Math.max(-limit,Math.min(limit,u))*132/limit;
  const y=58;svg.append(node('line',{x1:12,x2:294,y1:y,y2:y,stroke:'#536a62'}));const l=cfg.low??-limit,r=cfg.high??limit;
  svg.append(node('line',{x1:px(l),x2:px(r),y1:y,y2:y,stroke:'#7e5791','stroke-width':4}));
  for(const bound of [cfg.low,cfg.high].filter(v=>v!==null))svg.append(node('circle',{cx:px(bound),cy:y,r:4,fill:'white',stroke:'#734484','stroke-width':2}),node('text',{x:px(bound),y:82,'font-size':13,'text-anchor':'middle'},String(bound)));
  roots.forEach((k,i)=>{const u=Number(k)/q.d,h=i?28:41,pos=px(u),color=i?'#8a4010':'#07685d';svg.append(node('line',{x1:pos,x2:pos,y1:h+4,y2:y,stroke:color,'stroke-dasharray':'2 2'}));
   if(Math.abs(u)>limit)svg.append(node('path',{d:'M'+pos+' '+h+' l'+(u>0?-9:9)+' -4 v8 z',fill:color,'data-parameter-mark':'outside'}));
   else svg.append(i?node('rect',{x:pos-4,y:h-4,width:8,height:8,fill:color,'data-parameter-mark':'larger'}):node('circle',{cx:pos,cy:h,r:4,fill:color,'data-parameter-mark':'smaller'}));
  });
  host.append(svg);say('Круг — меньший корень '+fraction(roots[0],d)+', квадрат — больший '+fraction(roots[1],d)+'. Стрелка обозначает корень за рамкой.','rootPair',inside?'inside':'outside');return;
 }
 if(g.mode==='domains'){
  const raw=g.which===0?12n*d-25n*n:g.which===1?5n*n-11n*d:(3n*n-2n*d)**2n,bottom=g.which===2?d*d:d,valid=g.which===0?raw>=0n:raw>0n;
  say('Подкоренное выражение равно '+fraction(raw,bottom)+'. '+(raw<0n?'Корня среди действительных чисел нет.':raw===0n&&g.which!==0?'Корень равен нулю и находится в знаменателе.':g.which===0?'Знаменатель равен 6.':'Корень положителен, знаменатель ненулевой.'),'reviewDomain',valid?'yes':'no');return;
 }
 if(g.mode==='natural'){
  if(n<=0n||d!==1n){say('Для опыта выбери натуральное число.');return;}
  say('При n = '+n+' целая часть выражения 9n + 12 равна '+(9n*n+12n)+'. Слагаемое 12/n равно '+fraction(12n,n)+'.','divisorProbe',12n%n===0n?'yes':'no');return;
 }
 if(x<=0){say('Выбери положительное контрольное значение.');return;}
 if(g.mode==='formula'){
  const label=M.answer(q);say(g.which===0?'При основании a = 4 и площади S = '+label+' высота h = '+fraction(n,2n*d)+'. Подстановка: ah/2 = '+label+'.':g.which===1?'При m = 4 и s = '+label+' получаем p = '+fraction(n,2n*d)+'. Подстановка: s/p = 2 = 0,5m.':'При a = 2 и s = '+label+' положительное t = √('+label+') ≈ '+fmt(Math.sqrt(x))+'. Подстановка даёт at²/2 = '+label+'.','formulaProbe',g.which);return;
 }
 const up=fraction(20n*d,n),flat=fraction(60n*d,n+5n*d),total=fraction(20n*d*(n+5n*d)+60n*d*n,n*(n+5n*d));
 const table=document.createElement('table');table.className='values-table';for(const cells of [['Участок','км','км/ч','ч'],['Подъём','20',M.answer(q),up],['Равнина','60',fraction(n+5n*d,d),flat]]){const row=table.insertRow();cells.forEach(v=>{row.insertCell().textContent=v;});}host.append(table);say('Общее время '+total+' ч при требуемых 6 ч.','rideTotal',total);
}


function systemTrialView(host,g,value){
 host.className='task-graphs quantity-model';
 const probe=g.fixed??g.partial?.[0],x=M.parse(probe);
 if(x){
  const label=M.answer(x);
  g.rows.forEach((r,i)=>{const t=linearTrial(r,label);boundNote(host,'Строка '+(i+1)+' при '+g.variable+' = '+label+': слева '+t.left+', справа '+t.right+'; исходный знак '+r.operator+'.').dataset.systemTrial=(i+1)+'-'+(t.holds?'yes':'no');});
  if(g.holes?.length)boundNote(host,g.holes.some(h=>M.equal(x,M.parse(h)))?'Корни равны. Знаменатель обращается в ноль.':'Проверь существование обоих корней и их разность.').dataset.systemHole=g.holes.some(h=>M.equal(x,M.parse(h)))?'yes':'no';
 }else boundNote(host,'На первом шаге укажи своё число. Сравни обе стороны каждой строки при одной подстановке.');
 if(g.rangeRows?.some(Boolean)||g.proposal){
  const lines=g.rangeRows?.some(Boolean)?g.rangeRows.map(r=>r||[]):[];
  intervalNumberLine(host,{mode:'operation',givenRows:lines,rowLabels:lines.map((_,i)=>'Твоя строка '+(i+1)+': '),enteredRows:g.rangeRows,proposal:g.proposal,points:x?[x]:[]},value);
  if(lines.length)boundNote(host,'Прямые идут в порядке строк задачи. Последней показана твоя запись общего решения, если она уже введена.');
 }
 if(g.exampleProbes?.length)for(const v of g.exampleProbes){const raw=M.answer(v);if(g.integerResult&&v.d!==1){boundNote(host,'Твоя точка '+raw+' не является целым числом.').dataset.systemExample='no';continue;}const bad=g.rows.findIndex(r=>!linearTrial(r,raw).holds);boundNote(host,'Твой пример '+raw+(bad===-1?' выполняет все строки.':' не выполняет строку '+(bad+1)+'.')).dataset.systemExample=bad===-1?'yes':'no';}
}


function linearTrialGraph(host,g,value){
 host.className='task-graphs quantity-model';
 const raw=g.fixed??g.partial?.[0],trial=linearTrial(g,raw);
 if(trial){boundNote(host,'При '+g.variable+' = '+raw+': слева '+trial.left+', справа '+trial.right+'. Сравнение '+g.operator+(trial.holds?' выполняется.':' не выполняется.')).dataset.linearProbe=trial.holds?'yes':'no';}
 else boundNote(host,'Предложи рациональную подстановку на первом шаге. Обе стороны вычисляются раздельно.');
 if(g.proposal){intervalNumberLine(host,{mode:'operation',givenRows:[],proposal:g.proposal,points:g.samplePoints||[]},value);}
 if(g.exampleTrials?.length){for(const [v,t]of g.exampleTrials)boundNote(host,'Твой пример '+v+': '+t.left+' '+t.sign+' '+t.right+'.').dataset.exampleHolds=t.holds?'yes':'no';}
}


function intervalNumberLine(host,g,value){
 host.className='task-graphs quantity-model';
 const rows=g.givenRows||[],proposed=g.proposal,pointValues=g.points||[];
 const all=[...rows,...(proposed?[proposed]:[])],limitWords=v=>v==='-∞'?'−∞':v==='+∞'?'+∞':M.answer(v);
 const candidateNs=pointValues.map(p=>p.n/p.d);if(Number.isFinite(g.surd))candidateNs.push(Math.sqrt(g.surd));
 const numeric=all.flat().flatMap(r=>[r.min,r.max]).filter(Number.isFinite).concat(candidateNs);
 let lo=numeric.length?Math.min(...numeric):-2,hi=numeric.length?Math.max(...numeric):2;
 const margin=Math.max((hi-lo)*.18,.65);lo-=margin;hi+=margin;
 const x=n=>18+(n-lo)/(hi-lo)*284,canvas=node('svg',{viewBox:'0 0 320 '+(58+52*Math.max(all.length,1)),role:'img','aria-label':'Координатная прямая с исходными и построенными промежутками'});
 function line(a,b,y,color,weight){canvas.append(node('line',{x1:a,x2:b,y1:y,y2:y,stroke:color,'stroke-width':weight}));}
 const draw=(set,y,color,i)=>{
  line(10,307,y,'#536a62',1.5);
  canvas.append(node('path',{d:'M301 '+(y-4)+' L307 '+y+' L301 '+(y+4),fill:'none',stroke:'#536a62'}));
  for(const [partIndex,r] of set.entries()){
   const a=Number.isFinite(r.min)?x(r.min):11,b=Number.isFinite(r.max)?x(r.max):301;
   line(a,b,y,color,4);
   for(const [at,v,open,j]of [[a,r.left,r.leftOpen,0],[b,r.right,r.rightOpen,1]]){
    const repeatedLabel=j===0&&partIndex>0&&r.min===set[partIndex-1].max;
    if(typeof v==='string'){const dx=j?-6:6;canvas.append(node('path',{d:'M'+(at+dx)+' '+(y-5)+' L'+at+' '+y+' L'+(at+dx)+' '+(y+5),fill:'none',stroke:color,'stroke-width':2,'data-axis-arrow':j?'right':'left'}));continue;}
    canvas.append(node('circle',{cx:at,cy:y,r:4,'stroke-width':2,stroke:color,fill:open?'white':color,'data-axis-end':open?'open':'closed'}));
    // Give adjacent labels different baselines; caption retains every exact value.
    if((b-a>44||j===0)&&!repeatedLabel)canvas.append(node('text',{x:at,y:y+(j?17:-8),'text-anchor':'middle','font-size':12},limitWords(v)));
   }
  }
  canvas.append(node('g',{'data-axis-row':i}));
 };
 all.forEach((row,i)=>draw(row,24+52*i,i===rows.length?'#744481':i===0?'#087169':'#a65b24',i));
 if(!all.length)draw([],24,'#087169',0);
 const py=24+52*Math.max(0,all.length-1);for(const [i,p] of candidateNs.entries()){
  const isRoot=g.distinguishSurd&&i===candidateNs.length-1&&Number.isFinite(g.surd);
  canvas.append(node('path',{d:isRoot?'M'+x(p)+' '+(py+1)+' l4 5 -4 5 -4 -5 z':'M'+x(p)+' '+(py-2)+' l-4 -7 h8 z',fill:isRoot?'#68468a':'#9a432b','data-axis-probe':String(p),'data-probe-shape':isRoot?'diamond':'triangle'}));
 }
 host.append(canvas);
 const describe=r=>(r.leftOpen?'(':'[')+limitWords(r.left)+'; '+limitWords(r.right)+(r.rightOpen?')':']');
 if(g.mode==='read'){const first=rows[0]?.[0];if(first){const end=(v,open)=>typeof v==='string'?'стрелка к '+limitWords(v):(open?'пустая':'закрашенная')+' метка '+limitWords(v);canvas.setAttribute('aria-label','Слева '+end(first.left,first.leftOpen)+', справа '+end(first.right,first.rightOpen)+'. Выделен промежуток между ними.');}boundNote(host,'Читай рисунок: пустая метка исключена, закрашенная включена.');}
 else rows.forEach((r,i)=>boundNote(host,(g.rowLabels?.[i]||('Дано '+(rows.length>1?(i+1)+': ':'')))+(r.length?r.map(describe).join(' ∪ '):g.rowLabels&&!g.enteredRows[i]?'пока не построено':'∅')+'.'));
 if(proposed)boundNote(host,'Твоё построение: '+(proposed.length?proposed.map(describe).join(' ∪ '):'∅')+'.').dataset.axisProposal='yes';
 if(pointValues.length)boundNote(host,'Отмечены числа: '+pointValues.map(M.answer).join('; ')+'.');
 if(Number.isFinite(g.surd))boundNote(host,(g.distinguishSurd?'Ромб обозначает √':'Отмечена точка √')+g.surd+'. '+(g.distinguishSurd&&pointValues.length?'Треугольник — твоя точка. ':'')+'Сравнивай точно с квадратами концов.');
}
function intervalReview(host,g,value){
 host.className='task-graphs quantity-model';const q=M.parse(value);
 if(g.mode==='simplify'){boundNote(host,'Ненулевые исходные переменные: '+g.letters.join(', ')+'.');if(g.partial?.[1])boundNote(host,'Твой упрощённый числитель: '+g.partial[1]+'.');return;}
 if(g.mode==='positive'){boundNote(host,'a² − 2a + 5 = (a − 1)² + 4. Найди нижнюю границу по квадрату.');return;}
 if(g.mode==='evaluate'){if(!q){boundNote(host,'Введи свой x и проверь значение функции.');return;}const x=q.n/q.d;boundNote(host,x===2?'Для x = 2 знаменатель равен нулю.':'По твоей подстановке значение '+((3*x-1)/(x-2)).toLocaleString('ru-RU',{maximumSignificantDigits:8})+'.');return;}
 const pair=cornerValues(value);if(!pair||pair.some(p=>p.n<=0)){boundNote(host,'Скорость положительна, время каждого пути равно 120/v.');return;}
 const times=pair.map(p=>120*p.d/p.n);boundNote(host,'По твоим скоростям длительность поездок: '+times.map(t=>t.toLocaleString('ru-RU',{maximumFractionDigits:5})).join(' и ')+' ч. Разница '+((times[0]-times[1])*60).toLocaleString('ru-RU',{maximumFractionDigits:5})+' минут.').dataset.trainTimes='yes';
}


function setTokens(raw,letters){
 const s=String(raw??'').trim().toLowerCase().replace(/^\{(.*)\}$/,'$1').trim();
 if(!s)return null;if(['∅','нет','пусто'].includes(s))return [];
 const parts=s.split(/[,;\s]+/);if(parts.length>130)return null;
 if(!parts.every(x=>letters?/^[а-яё]$/.test(x):/^[+-]?\d{1,12}$/.test(x)))return null;
 return [...new Set(parts.map(v=>letters?v:String(Number(v))))];
}
function integerProbe(raw){const v=M.parse(raw);return v?.d===1?v.n:null;}
function setMembership(g,token){
 if(g.first)return [g.first.some(x=>String(x)===String(token)),g.second.some(x=>String(x)===String(token))];
 const n=integerProbe(token);if(n===null)return null;
 // Any integer above 40 is composite or prime independently of the finite source set.
 const prime=k=>{if(k<2)return false;if(k%2===0)return k===2;for(let f=3;f*f<=k;f+=2)if(k%f===0)return false;return true;};
 if(g.rule==='prime40-digit')return [n<=40&&prime(n),n>=10&&n<=99];if(g.rule==='digit-multiple')return [n>=10&&n<=99,n>0&&n%19===0];
 if(g.rule==='square-cube')return [n>0&&Number.isInteger(Math.sqrt(n)),n>0&&Math.round(Math.cbrt(n))**3===n];
 if(g.rule==='prime-composite'){const simple=prime(n);return [simple,n>1&&!simple];}
 const multiple=/^m(\d+)-m(\d+)$/.exec(g.rule||'');return multiple?[n%Number(multiple[1])===0,n%Number(multiple[2])===0]:null;
}
function eulerDiagram(host,g,value){
 host.className='task-graphs quantity-model';
 const relNames={'пересекаются без вложения':'overlap','первое содержится во втором':'left-in-right','второе содержится в первом':'right-in-left','не пересекаются':'disjoint'};
 const chosen=relNames[g.partial?.[g.relationStep]],rel=chosen||g.relation;
 const svg=node('svg',{viewBox:'0 0 320 142',role:'img','aria-label':'Круги Эйлера для '+g.left+' и '+g.right,'data-euler-relation':rel});
 const lookup={equal:[[160,71,62],[160,71,62]],overlap:[[117,71,62],[201,71,62]],'left-in-right':[[134,71,32],[157,71,64]],'right-in-left':[[156,71,64],[181,71,32]],disjoint:[[78,71,57],[242,71,57]],triple:[[135,71,28],[150,71,45],[163,71,64]]};
 const regions=lookup[rel],colors=['#148078','#94602c','#486b9f'];if(!regions)return;
 const circle=([cx,cy,r],other)=>node('circle',{cx,cy,r,...other});
 if(rel!=='triple'){
  if(g.operation==='intersection'){const clip=node('clipPath',{id:'m8-common-set'});clip.append(circle(regions[0],{}));const defs=node('defs');defs.append(clip);svg.append(defs,circle(regions[1],{fill:'#b7dfd0','clip-path':'url(#m8-common-set)'}));}
  if(g.operation==='union'||g.operation==='left'||g.operation==='right')regions.forEach((z,i)=>{if(g.operation==='union'||i===(g.operation==='left'?0:1))svg.append(circle(z,{fill:'#d3e9e2'}));});
 }
 regions.forEach((z,i)=>svg.append(circle(z,{fill:'none',stroke:colors[i],'stroke-width':3,'stroke-dasharray':i===1?'7 3':'none'})));
 const glyphs=rel==='equal'?[[134,75,'A'],[185,75,'B']]:rel==='triple'?[[135,75,'N'],[177,75,'Z'],[208,75,'Q']]:rel==='left-in-right'?[[134,75,'A'],[201,75,'B']]:rel==='right-in-left'?[[109,75,'A'],[181,75,'B']]:[[regions[0][0]-19,75,'A'],[regions[1][0]+19,75,'B']];
 glyphs.forEach(([x,y,s])=>svg.append(node('text',{x,y,'font-size':15,'text-anchor':'middle'},s)));host.append(svg);
 boundNote(host,rel==='triple'?'N — натуральные, Z — целые, Q — рациональные.':'A: '+g.left+'. B: '+g.right+'.');
 const tokens=g.first?setTokens(value,g.letters):g.fixed!==undefined?[g.fixed]:[g.own?value:g.partial?.[0]];
 if(tokens)for(const token of tokens){const which=setMembership(g,token);if(!which)continue;const [a,b]=which;boundNote(host,String(token)+' — '+(a&&b?'в обоих множествах':a?'только в A':b?'только в B':'вне обоих множеств')+'.').dataset.setArea=a&&b?'both':a?'left':b?'right':'outside';}
}
function segmentDiagram(host,g,value){
 host.className='task-graphs quantity-model';const pts={A:27,C:138,B:189,D:296};
 const svg=node('svg',{viewBox:'0 0 320 98',role:'img','aria-label':'Отрезки AB и CD на одной прямой, точки A, C, B, D'});
 svg.append(node('line',{x1:pts.A,x2:pts.B,y1:33,y2:33,stroke:'#147769','stroke-width':4}),node('line',{x1:pts.C,x2:pts.D,y1:40,y2:40,stroke:'#a45829','stroke-width':4,'stroke-dasharray':'7 2'}));
 for(const [s,x]of Object.entries(pts))svg.append(node('circle',{cx:x,cy:37,r:3,fill:'#243d33'}),node('text',{x,y:65,'text-anchor':'middle','font-size':15},s));
 const pair=String(value??'').toUpperCase().replaceAll(/\s/g,'');if(/^[ABCD]{2}$/.test(pair)&&pair[0]!==pair[1])svg.append(node('line',{x1:pts[pair[0]],x2:pts[pair[1]],y1:78,y2:78,stroke:'#4c528c','stroke-width':5,'data-proposed-segment':pair}));
 host.append(svg);boundNote(host,'Зелёная линия — AB, штриховая — CD. Твой отрезок появится под буквами.');
}
function setReview(host,g,value){
 host.className='task-graphs quantity-model';
 if(g.type==='harvest-check'){const v=cornerValues(value);if(!v||v.some(x=>x.n<=0)){boundNote(host,'Раздели урожай каждого хозяйства на его урожайность, чтобы найти площадь.');return;}
  const x=v[0].n/v[0].d,y=v[1].n/v[1].d;boundNote(host,'При твоих урожайностях площади равны '+(180/x).toLocaleString('ru-RU',{maximumSignificantDigits:6})+' и '+(160/y).toLocaleString('ru-RU',{maximumSignificantDigits:6})+' га.').dataset.harvestTrial='yes';return;}
 const k=M.parse(value);if(!k){boundNote(host,'Проверь вид y = kx: нулевому x соответствует нулевой y.');return;}
 const slope=k.n/k.d;boundNote(host,'У твоей прямой при x = 1 получаем y = '+M.answer(k)+'.').dataset.lineTrial='yes';
 host.append(graph(slope,0,[],4,'Предложенная прямая через начало координат'));
}


function cornerValues(raw){
 const parts=String(raw??'').split(';').map(s=>M.parse(s.trim()));return parts.length===2&&parts.every(Boolean)?parts:null;
}
function combinedBounds(host,g){
 host.className='task-graphs quantity-model';
 g.ranges.forEach((r,i)=>{boundNote(host,'Данные границы для '+g.symbols[i]);intervalDiagram(host,'Промежуток для '+g.symbols[i],r.map(M.parse),[!g.closed,!g.closed]);});
 const learner=cornerValues(g.partial?.[0]);
 if(learner)boundNote(host,'Для нижней оценки выбраны '+g.symbols.map((s,i)=>s+' = '+M.answer(learner[i])).join(', ')+'.').dataset.boundCorner='yes';
 if(g.proposal){const q=g.proposal;boundNote(host,'Твой промежуток для '+g.expression+(g.unit?' ('+g.unit+')':''));intervalDiagram(host,'Твой ответ',[q.left,q.right],[q.leftOpen,q.rightOpen]);}
}
function comparisonPair(host,g,value){
 host.className='task-graphs quantity-model';const op=g.operation==='sum'?'+':'·';
 const [a,b]=g.sides[0],[c,d]=g.sides[1];boundNote(host,'Слева: ('+a+') '+op+' ('+c+'). Справа: ('+b+') '+op+' ('+d+').');
 if(value)boundNote(host,'Твоё получившееся сравнение: '+value).dataset.combinedTrial='yes';
}
function powerOrder(host,g){
 host.className='task-graphs quantity-model';const probe=cornerValues(g.partial?.[0]);if(!probe){boundNote(host,'Введи свои положительные основания a и b на первом шаге.');return;}
 const [a,b]=probe.map(v=>v.n/v.d),r=g.powers;
 for(const p of r){const x=a**p,y=b**p,relation=x<y?' < ':x>y?' > ':' = ';boundNote(host,'Степень '+p+': '+x.toLocaleString('ru-RU',{maximumSignificantDigits:7})+relation+y.toLocaleString('ru-RU',{maximumSignificantDigits:7})+'.').dataset.powerTrial=String(p);}
}
function medianFigure(host,g,value){
 host.className='task-graphs quantity-model';
 const raw=g.own?value:g.partial?.[0],trial=cornerValues(raw);
 if(!trial||trial[1].n<=0){boundNote(host,'Возьми A(0;0), C(2;0), предложи свои координаты B(u;v) выше основания. Точка O — середина AC.');return;}
 const u=trial[0].n/trial[0].d,v=trial[1].n/trial[1].d;
 const vertices={A:[0,0],B:[u,v],C:[2,0],D:[2-u,-v],O:[1,0]};
 const xs=Object.values(vertices).map(p=>p[0]),span=Math.max(2,Math.max(...xs)-Math.min(...xs)),mid=(Math.max(...xs)+Math.min(...xs))/2;
 const scale=Math.min(262/span,88/v),project=([x,y])=>[160+(x-mid)*scale,106-y*scale];
 const canvas=node('svg',{viewBox:'0 0 320 216',role:'img','aria-label':'Треугольник ABC, медиана BO и отрезок OD на её продолжении'});
 function segment(a,b,stroke,dashed=false){const [x1,y1]=project(vertices[a]),[x2,y2]=project(vertices[b]);canvas.append(node('line',{x1,y1,x2,y2,stroke,'stroke-width':2,'stroke-dasharray':dashed?'6 4':'none'}));}
 segment('A','B','#2b554a');segment('B','C','#2b554a');segment('A','C','#2b554a');segment('B','O','#9c3f27');segment('O','D','#9c3f27',true);segment('A','D','#37688b',true);segment('C','D','#37688b',true);
 for(const [k,xy]of Object.entries(vertices)){const [x,y]=project(xy),dx=k==='A'?-9:k==='C'?9:0,dy=k==='D'?13:-6;canvas.append(node('circle',{cx:x,cy:y,r:3,fill:'#145e54','data-median-point':k}),node('text',{x:x+dx,y:y+dy,'text-anchor':'middle','font-size':13},k));}
 host.append(canvas);boundNote(host,'Твои координаты B: ('+trial.map(M.answer).join('; ')+'). Вектор OD противоположен OB. По построению BO = OD, AO = OC.').dataset.medianTrial='yes';
}
function diagonalProof(host,g){
 host.className='task-graphs quantity-model';const pts={A:[48,115],B:[170,29],C:[270,115],D:[170,174],O:[170,115]};
 const svg=node('svg',{viewBox:'0 0 320 200',role:'img','aria-label':'Выпуклый четырёхугольник ABCD и треугольники AOB, COD'});
 for(const [a,b,col]of [['A','B','#274d45'],['B','C','#274d45'],['C','D','#274d45'],['D','A','#274d45'],['A','C','#37688b'],['B','D','#a65026']]){
  const [x1,y1]=pts[a],[x2,y2]=pts[b];svg.append(node('line',{x1,y1,x2,y2,stroke:col,'stroke-width':2}));
 }
 for(const [k,[x,y]]of Object.entries(pts))svg.append(node('circle',{cx:x,cy:y,r:3,fill:'#145e54'}),node('text',{x:x+7,y:y-6,'font-size':14},k));
 host.append(svg);boundNote(host,'O — пересечение диагоналей. Сопоставь сторону AB с ломаной AOB и сторону CD с COD.');
}
function contextBound(host,g,value){
 host.className='task-graphs quantity-model';
 if(g.type==='mean-factors'){
  const pairs=g.mode==='three'?[['a','b'],['b','c'],['a','c']]:g.mode==='four'?[['a','1'],['b','1'],['a','c'],['b','c']]:[['a','b']];
  for(const [x,y]of pairs)boundNote(host,'('+x+' + '+y+')/2 ≥ √('+x+'·'+y+').');
  if(g.partial?.[0])boundNote(host,'Твой первый шаг: '+g.partial[0]+'.');return;
 }
 if(g.type==='signed-square-proof'){boundNote(host,g.k===3?'После приведения дроби к общему знаменателю: (3a − 1)²/a.':'После приведения дроби к общему знаменателю: (5b + 1)²/b.');if(g.partial?.[0])boundNote(host,'Твоё значение для равенства: '+g.symbol+' = '+g.partial[0]+'.');return;}
 if(g.type==='library-area'){boundNote(host,'Наименьший прямоугольник: '+g.base.join(' × ')+' м. Требование: не менее '+g.required+' м².');if(g.partial?.[0])boundNote(host,'Твоя оценка минимальной площади: '+g.partial[0]+' м².');return;}
 if(g.type==='cancel-ratio'){boundNote(host,'Разложи 16 − 9x² на два линейных множителя и отдельно проверь нули внешнего делителя.');if(g.partial?.[0])boundNote(host,'Твой список недопустимых значений: '+g.partial[0]+'.');return;}
 if(g.type==='cut-square'){const v=M.parse(value);boundNote(host,'Сторона листа x, ширина отрезанной полосы 5 дм. Остаток имеет стороны x и x − 5.');if(v){const x=v.n/v.d;boundNote(host,x<=5?'Такой лист не оставляет прямоугольника положительной площади.':'При твоей стороне остаток имеет площадь '+(x*(x-5)).toLocaleString('ru-RU',{maximumSignificantDigits:8})+' дм².');}}
}


function intervalDiagram(host,label,ends,opened){
 const bounds=ends.map(M.answer),svg=node('svg',{viewBox:'0 0 340 74',role:'img','aria-label':label+' '+bounds.join(' … ')});
 const [a,b]=ends;
 if(BigInt(a.n)*BigInt(b.d)>=BigInt(b.n)*BigInt(a.d)){boundNote(host,'Левая граница должна быть меньше правой.');return;}
 svg.append(node('line',{x1:12,x2:328,y1:25,y2:25,stroke:'#52665d','stroke-width':2}),node('path',{d:'M322 21 L328 25 L322 29',stroke:'#52665d',fill:'none'}),node('line',{x1:75,x2:265,y1:25,y2:25,stroke:'#06716a','stroke-width':5}));
 [75,265].forEach((x,i)=>svg.append(node('circle',{cx:x,cy:25,r:6,stroke:'#066258','stroke-width':2,fill:opened[i]?'white':'#066258','data-boundary':opened[i]?'open':'closed'}),node('text',{x,y:55,'text-anchor':'middle','font-size':16},bounds[i])));host.append(svg);
}
function estimateDiagram(host,g){
 host.className='task-graphs quantity-model';
 boundNote(host,'Данный промежуток для '+g.variable);
 intervalDiagram(host,'Дано',g.source.map(M.parse),[!g.closed,!g.closed]);
 if(!g.proposal){const steps=g.partial||[];boundNote(host,'После преобразования концов: '+(steps[0]||'…')+' и '+(steps[1]||'…')+'. Введи свой интервал.');return;}
 const q=g.proposal;boundNote(host,'Твой промежуток для '+g.expression+(g.unit?' ('+g.unit+')':''));
 intervalDiagram(host,'Твой промежуток',[q.left,q.right],[q.leftOpen,q.rightOpen]);
}
function rankExpressions(host,g){
 host.className='task-graphs quantity-model';
 let values;
 if(g.mode==='reciprocals'){
  const trial=coordinateEvidence(g.trial,['a','b','c','d'],['d','b','a','c'],[['d','>','0']]);
  if(trial?.valid)values=trial.fields.map(v=>M.answer({n:v.d,d:v.n}));
 }else{
  const trial=M.parse(g.trial);if(trial?.n>0){
   const a=trial.n/trial.d,r=Math.sqrt;
   values=(g.mode==='positive'?[2*a,a*r(3),-a,a/(r(3)+r(2)),3*a]:[6*a,-a*r(5),a/(r(7)+r(6)),-a,-5*a-1]).map(v=>v.toLocaleString('ru-RU',{maximumSignificantDigits:5}));
  }
 }
 if(values){boundNote(host,(g.mode==='reciprocals'?'Точные значения':'Приближения при данном a')+': '+g.labels.map((l,i)=>l+(g.mode==='reciprocals'?' = ':' ≈ ')+values[i]).join(', ')+'.').dataset.rankTrial='yes';}
 else boundNote(host,'Введи допустимый пример на первом шаге. Для общего вывода обоснуй порядок выражений.');
 if(g.selected?.length)boundNote(host,'Твой порядок: '+g.selected.map(i=>g.labels[i-1]).join(g.ascending?' < ':' > ')).dataset.rankOrder='yes';
}
function surdComparison(host,g,value){
 host.className='task-graphs quantity-model';const r=Math.sqrt;
 const pairs=[[r(11)+13,15],[r(84),7+r(6)],[r(8)-r(3),2],[r(47)-r(7),5],[r(2)+5,2+r(5)],[r(3)-4,1-r(5)],[(2*r(3)+23)/3,9],[(1-r(15))/12,-7/8]];
 boundNote(host,'Сравни '+g.labels[0]+' и '+g.labels[1]+'. Точные преобразования выполни в шагах.');
 if(['<','=','>'].includes(value))boundNote(host,'Проверка приближениями с твоим знаком: '+pairs[g.row].map(v=>v.toLocaleString('ru-RU',{maximumFractionDigits:4})).join(' '+value+' ')+'.').dataset.surdTrial=value;
}
function squareSubstitution(host,g){
 host.className='task-graphs quantity-model';boundNote(host,'При x = '+g.given+' преобразуй выражение к (x − 2)² − 3.');
 const a=M.parse(g.partial?.[1]);if(!a)return;
 const difference=String(BigInt(a.n)-3n*BigInt(a.d))+(a.d===1?'':'/'+a.d);
 boundNote(host,'По твоему шагу квадрат равен '+M.answer(a)+'. После вычитания 3 получается '+difference+'.').dataset.squareTrial='yes';
}


function coordinateEvidence(raw,symbols,expected,bounds=[]){
 const fields=String(raw??'').split(';').map(s=>M.parse(s.trim()));
 if(fields.length!==symbols.length||fields.some(v=>!v))return null;
 const by=new Map(symbols.map((s,i)=>[s,fields[i]]));
 const difference=(v,w)=>BigInt(v.n)*BigInt(w.d)-BigInt(w.n)*BigInt(v.d);
 const pairs=expected.slice(1).map((s,i)=>({left:expected[i],right:s,ok:difference(by.get(expected[i]),by.get(s))<0n}));
 const admitted=bounds.every(([symbol,sign,bound])=>sign==='<'?difference(by.get(symbol),M.parse(bound))<0n:difference(by.get(symbol),M.parse(bound))>0n);
 return {fields,pairs,admitted,valid:admitted&&pairs.every(row=>row.ok)};
}
function labelledOrder(host,g,value){
 host.className='task-graphs quantity-model';
 const raw=g.useStep?g.trial:value,check=coordinateEvidence(raw,g.symbols,g.ordered,g.coordinateBounds);
 const p=document.createElement('p');p.className='small';
 if(!check){p.textContent='Введи числовые координаты в порядке '+g.symbols.join('; ')+'. На прямой большее число находится правее.';host.append(p);return;}
 const axis=node('svg',{viewBox:'0 0 360 148',role:'img','aria-label':'Предложенная координатная прямая и метки '+g.symbols.join(', ')});
 const values=check.fields.map(v=>v.n/v.d),min=Math.min(...values),max=Math.max(...values);
 const position=y=>min===max?180:26+308*(y-min)/(max-min);
 axis.append(node('line',{x1:12,x2:349,y1:50,y2:50,stroke:'#435d52','stroke-width':2}),node('path',{d:'M341 45 L349 50 L341 55',stroke:'#435d52',fill:'none'}));
 // Labels use their own rows even if neighbouring rational coordinates crowd.
 check.fields.forEach((v,i)=>{const at=position(values[i]),down=69+15*i;
  axis.append(node('line',{x1:at,x2:at,y1:50,y2:down-7,stroke:'#58877d','stroke-dasharray':'2 2'}),node('circle',{cx:at,cy:50,r:3,fill:'#087981'}),node('text',{x:at,y:down,'text-anchor':'middle','font-size':14},g.symbols[i]));
 });
 p.textContent=g.symbols.map((c,i)=>c+' = '+M.answer(check.fields[i])).join(', ')+'.';host.append(axis,p);
 for(const row of check.pairs){const line=document.createElement('p');line.className='small';line.dataset.coordinatePair=row.ok?'yes':'no';line.textContent=row.left+' < '+row.right+(row.ok?' выполняется.':' нарушено: проверь координаты этих точек.');host.append(line);}
 if(g.coordinateBounds?.length){const line=document.createElement('p');line.className='small';line.dataset.coordinateBound=check.admitted?'yes':'no';line.textContent=g.coordinateBounds.map(r=>r.join(' ')).join(', ')+(check.admitted?' выполнено.':' нарушено.');host.append(line);}
}
function transformedNumbers(host,g,value){
 host.className='task-graphs quantity-model';const caption=document.createElement('p');caption.className='small';caption.textContent='Исходное сравнение: '+g.original+'. Действие с обеими сторонами: '+g.action+'.';host.append(caption);
 const m=/^\s*([^<>]+)\s*([<>])\s*([^<>]+)\s*$/.exec(String(value??''));if(!m)return;
 const left=M.parse(m[1]),right=M.parse(m[3]);if(!left||!right)return;
 const delta=BigInt(left.n)*BigInt(right.d)-BigInt(right.n)*BigInt(left.d),sign=delta<0n?'<':delta>0n?'>':'=';
 const p=document.createElement('p');p.className='small';p.dataset.proposedOrder=sign===m[2]?'true':'false';
 p.textContent='Между твоими числами верна запись '+M.answer(left)+' '+sign+' '+M.answer(right)+'. Сверь обе полученные стороны с действием задания.';host.append(p);
}

function admissibleSample(raw,domain,count){
 const xs=String(raw??'').split(';').map(v=>M.parse(v.trim()));
 if(xs.length!==count||xs.some(v=>!v))return false;
 const [a,b]=xs;
 if(domain==='lt-pair'||domain==='gt-pair'){
  if(xs.length!==2)return false;
  const delta=BigInt(a.n)*BigInt(b.d)-BigInt(b.n)*BigInt(a.d);return domain==='lt-pair'?delta<0n:delta>0n;
 }
 if(domain==='all-real')return true;
 if(['triangle-sides','strict-max','weak-max','tied-max'].includes(domain)){
  if(xs.length!==3||xs.some(v=>v.n<=0))return false;
  const c=xs[2],ab=compareRationals(a,b),ac=compareRationals(a,c);
  if(domain==='strict-max')return ab>0n&&ac>0n;
  if(domain==='weak-max')return ab>=0n&&ac>=0n;
  if(domain==='tied-max')return ab===0n&&ac>=0n;
  const den=xs.reduce((v,t)=>v*BigInt(t.d),1n),scaled=xs.map(q=>BigInt(q.n)*(den/BigInt(q.d))),sum=scaled.reduce((s,v)=>s+v,0n);
  return scaled.every(t=>sum>2n*t);
 }
 if(domain==='above-three')return xs.length===1&&BigInt(a.n)>3n*BigInt(a.d);
 if(domain==='speed-current'||domain==='two-rivers'){
  const gt=(u,v)=>BigInt(u.n)*BigInt(v.d)>BigInt(v.n)*BigInt(u.d);
  return domain==='speed-current'?xs.length===2&&b.n>0&&gt(a,b):xs.length===4&&b.n>0&&xs[3].n>0&&gt(a,xs[2])&&gt(xs[2],b);
 }
 if(domain==='above-one')return xs.length===1&&a.n>a.d;
 if(domain==='ride-plan')return xs.length===2&&BigInt(a.n)>2n*BigInt(a.d)&&b.n>0;
 if(domain==='product-nine')return xs.length===3&&xs.every(v=>v.n>0)&&xs.reduce((p,v)=>p*BigInt(v.n),1n)===9n*xs.reduce((p,v)=>p*BigInt(v.d),1n);
 if(domain==='root-sum-one'){
  if(xs.length!==3||xs.some(v=>4n*BigInt(v.n)<-BigInt(v.d)))return false;
  const den=xs.reduce((p,v)=>p*BigInt(v.d),1n);
  return xs.reduce((sum,v)=>sum+BigInt(v.n)*(den/BigInt(v.d)),0n)===den;
 }
 if(domain==='nonnegative')return xs.every(v=>v.n>=0);
 if(xs.some(v=>v.n<=0))return false;
 if(domain==='positive')return true;
 if(domain==='natural-single')return xs.length===1&&a.d===1;
 if(!b)return false;
 const diff=BigInt(a.n)*BigInt(b.d)-BigInt(b.n)*BigInt(a.d);
 if(domain==='positive-unequal')return diff!==0n;
 if(!xs.every(v=>v.d===1))return false;
 return domain==='natural-gt'?diff>0n:domain==='natural-lt'&&diff<0n;
}
function radicalComparison(host,config,value){
 host.className='task-graphs quantity-model';
 const add=message=>{const p=document.createElement('p');p.className='small';p.textContent=message;host.append(p);};
 for(const [i,[a,b,sign]] of config.pairs.entries()){
  add('Квадрат '+(i?'второго':'первого')+' выражения: '+(a+b)+(sign>0?' + ':' − ')+'2√'+(a*b)+'.');
 }
 if(['<','=','>'].includes(value)){
  const [[a,b,sign],[c,d,otherSign]]=config.pairs;
  if(a+b!==c+d||sign!==otherSign)return;
  const comparison=sign*Math.sign(a*b-c*d),ok=value===(comparison<0?'<':comparison>0?'>':'=');
  const row=document.createElement('p');row.className='small';row.dataset.radicalOrder=ok?'yes':'no';row.textContent='Твой знак: '+config.labels.join(' '+value+' ')+'. '+(ok?'Сравнение согласуется с квадратами.':'Проверь знак перед удвоенным корнем.');host.append(row);
 }
}
function inequalityTrial(config,value,unrestricted=false){
 const input=String(value??'').trim(),parts=input.split(';');
 if(parts.length!==config.symbols.length||parts.some(v=>!M.parse(v)))return null;
 const evidence=sourceFractionTrial({symbols:config.symbols,original:config.left,reduced:config.right},input,unrestricted);
 if(!evidence||evidence.original===null||evidence.reduced===null)return null;
 const [an,ad='1']=evidence.original.split('/'),[bn,bd='1']=evidence.reduced.split('/');
 const delta=BigInt(an)*BigInt(bd)-BigInt(bn)*BigInt(ad);
 return {left:evidence.original,right:evidence.reduced,sign:delta>0n?'>':delta<0n?'<':'='};
}
function inequalityScene(host,config,value){
 host.className='task-graphs quantity-model';
 const input=config.mode==='given'?config.given:config.mode==='pair-example'&&String(value??'').trim()?value:config.mode==='counter'&&String(value??'').trim()&&M.parse(value)?value:config.trial;
 const add=(txt,key,state)=>{const p=document.createElement('p');p.className='small';p.textContent=txt;if(key)p.dataset[key]=state;host.append(p);};
 if(config.predictionStep!==undefined){
  if(!config.prediction){add(config.completed?'Доказательство завершено: дольше во второй день. До проверки гипотеза не записана.':'Сначала запиши гипотезу. Можно предположить любой из трёх исходов.','predictionStatus',config.completed?'no-forecast':'pending');return;}
  const actual='дольше во второй день',message=config.completed?(config.prediction===actual?'Прогноз подтвердился: ':'Исследование изменило твой прогноз: ')+actual+'.':'Твой исходный прогноз: '+config.prediction+'. Теперь проверь времена по формулам.';
  add(message,'predictionStatus',config.completed?'reviewed':'saved');
 }
 if(!input){add('На числовой прямой большее значение располагается правее. Подставь число в первом шаге и сравни обе стороны.');return;}
 if(config.sourceDomain&&!admissibleSample(input,config.sourceDomain,config.symbols.length)){
  const constraints={'lt-pair':'первое число должно быть меньше второго','gt-pair':'первое число должно быть больше второго','natural-gt':'нужны натуральные a > b','natural-lt':'нужны натуральные a < b','positive':'каждая величина должна быть положительна','nonnegative':'нужны неотрицательные величины','positive-unequal':'нужны положительные и разные a и b','product-nine':'нужны положительные a,b,c с произведением 9','ride-plan':'плановая скорость должна превышать 2, а расстояние быть положительным','above-three':'требуется a>3','above-one':'требуется значение больше 1','all-real':'подставь действительные числа','speed-current':'нужно v>c>0','two-rivers':'нужно x>z>y>0 и s>0'};
  add('Подстановка вне условия: '+constraints[config.sourceDomain]+'.','inequalityDomain','invalid');return;
 }
 if(config.compareSquares)add('На оси показаны квадраты двух неотрицательных сторон.');
 const check=inequalityTrial(config,input,Boolean(config.sourceDomain)||config.mode==='counter'||config.mode==='pair-example');if(!check){add('Введи отдельное рациональное значение для каждой переменной.');return;}
 const setting=String(input).split(';').map((v,i)=>config.symbols[i]+' = '+v).join(', ');
 add('При '+setting+' получаем: '+check.left+' '+check.sign+' '+check.right+'.','inequalityRelation',check.sign);
 const svg=node('svg',{viewBox:'0 0 320 107',role:'img','aria-label':'Расположение значений из этой подстановки: '+check.left+' '+check.sign+' '+check.right});
 // A local scale spans the two submitted values. Heights separate the two
 // labels when the values coincide; no absolute zero is implied by placement.
 const positions=check.sign==='<'?[55,265]:check.sign==='>'?[265,55]:[160,160];
 svg.append(node('line',{x1:20,x2:301,y1:52,y2:52,stroke:'#536d65','stroke-width':2}),node('path',{d:'M294 47 L301 52 L294 57',stroke:'#536d65',fill:'none'}));
 for(const [i,x]of positions.entries()){
  const c=i?'#99500e':'#087981',label=i?'вторая':'первая';
  svg.append(node('line',{x1:x,x2:x,y1:52,y2:i?72:31,stroke:c,'stroke-width':2}));
  svg.append(i?node('rect',{x:x-4,y:48,width:8,height:8,fill:c}):node('circle',{cx:x,cy:52,r:6,fill:'white',stroke:c,'stroke-width':2}));
  svg.append(node('text',{x,y:i?89:21,'text-anchor':'middle','font-size':15,fill:c},label));
 }
 host.prepend(svg);
 if(config.mode!=='given')add('Модель проверяет эту подстановку. Для вывода при любых значениях обоснуй знак разности алгебраически.');
}

function linearReview(host,config,value){
 host.className='task-graphs root-graph';
 const C=window.MakarychevCheck;
 const parse=z=>{const r=M.parse(z);return r?r.n/r.d:NaN;};
 const asCurve=([a,b,c],i)=>b?{kind:'line',k:-a/b,b:c/b,dashed:i>0}:{kind:'vertical',h:c/a,dashed:i>0};
 const curves=config.lines.map(asCurve),points=[...(config.points||[])];
 const say=(message,key,status)=>{const p=document.createElement('p');p.className='small';p.textContent=message;if(key)p.dataset[key]=status;host.append(p);};
 if(config.mode==='parameters'){
  const coordinates=String(value||'').split(';');
  const data=coordinates.map(parse);
  if(data.length===2&&data.every(Number.isFinite)){
   const [m,b]=data;curves.push(asCurve([2,-b,-10],1));points.push([m,3]);
   const subs=[-3*m+3,2*m-3*b];say('При (m; 3) левые части приближённо равны '+subs.map(v=>v.toLocaleString('ru',{maximumFractionDigits:5})).join(' и ')+'. Справа стоят 9 и −10.','parameterPoint',M.equal(coordinates[0],'-2')&&M.equal(coordinates[1],'2')?'yes':'no');
  }else say('Введите m и b, чтобы провести вторую прямую и проверить точку (m; 3).');
 }else if(config.mode==='triple'){
  const t=C.systemTriple(value);
  if(t){const [a,b,c]=t.values;
   if(a!==0||b!==0)curves.push(asCurve(t.values,1));
   const message=t.nonzero?'У прямых разные направления. Они пересекаются в одной точке.':a===0&&b===0?'Вторая строка вообще не задаёт прямую.':t.same?'Второе уравнение задаёт ту же прямую.':'Прямые параллельны и различны.';
   say(message,'lineRelation',t.nonzero?'intersect':a===0&&b===0?'degenerate':'parallel-or-same');
  }else say('Сплошная прямая задана условием. Введи a; b; c, чтобы добавить свой вариант.');
 }else if(config.mode==='constant'){
  const raw=config.trial||value,r=M.parse(raw);
  if(r){curves.push(asCurve([10,-4,r.n/r.d],1));const same=M.equal(raw,'6');say('При c = '+raw+(same?' обе строки дают одну прямую.':' две прямые параллельны и различны.'),'lineRelation',same?'same':'parallel');}
  else say('Подставь пробное c в первом шаге, чтобы увидеть вторую прямую.');
 }else{
  if(config.fromSystem&&config.trial){
   const coords=String(config.trial).split(';').map(parse);
   if(coords.length===2&&coords.every(Number.isFinite)){
    points.push(coords);const [x,y]=coords;
    const valid=3*x-2*y===16&&4*x+3*y===-7;
    say(valid?'Пробная точка удовлетворяет обеим исходным прямым.':'Проверь пробную точку в обоих исходных уравнениях.','systemPoint',valid?'yes':'no');
   }
  }
  const proposal=C.affinePlot(value);
  if(proposal){curves.push({kind:'line',...proposal,dashed:curves.length>0});const required=config.fromSystem?[...config.points,[2,-5]]:config.points;
    for(const [x,y] of required){
     const on=proposal.atPoint(x,y);
     const label=config.fromSystem&&x===2?'Точка пересечения исходных прямых':'Точка ('+x+'; '+y+')';
     say(label+(on?' лежит на введённой прямой.':' не лежит на введённой прямой.'),'pointOnCandidate',on?'yes':'no');
    }
  }else say(config.fromSystem?'На рисунке показаны исходные прямые и данная точка. Введи формулу искомой прямой.':'По заданным точкам составь формулу y = kx + d. Введённая прямая появится на рисунке.');
 }
 const legend=document.createElement('p');legend.className='small';
 if(config.fromSystem){
  legend.textContent='Сплошная: 3x − 2y = 16. Короткие штрихи: 4x + 3y = −7.';
  if(curves.length===3){curves[2].dashPattern='14 3';legend.textContent+=' Длинные штрихи: введённая функция.';}
 }else if(config.mode==='through')legend.textContent=curves.length?'Сплошная линия показывает введённую функцию. Точки заданы в условии.':'На рисунке отмечены заданные точки.';
 else legend.textContent='Сплошная линия показывает первую строку.'+(curves.length>1?' Штриховая — вторую строку.':'');
 const b=config.bounds;host.prepend(rootGraph({curves,points,xRange:[-b,b],yRange:[-b,b],label:legend.textContent},''),legend);
}

function quantityTrial(graph,raw){
 const [x]=fractionSample(raw,1)||[];
 if(!x)return null;
 const evaluate=(left,right)=>sourceFractionTrial({symbols:['x'],original:left,reduced:right},raw);
 const validNumber=(value,domain)=>{
  if(value===null||value==='0'||value.startsWith('-'))return false;
  const [n,d='1']=value.split('/');
  if(domain==='integer')return d==='1';
  return domain!=='fraction'||BigInt(n)<=BigInt(d);
 };
 const rows=graph.rows.map(row=>{
  const value=evaluate(row.formula,'0').original;
  return {...row,value,valid:validNumber(value,row.domain)};
 });
 const valid=x.n>0&&rows.every(row=>row.valid);
 const comparison=valid?evaluate(graph.comparison,graph.target):null;
 return {rows,valid,value:comparison?.original,agrees:valid&&comparison.original===comparison.reduced};
}

function quantityAudit(host,graph,value){
 host.className='task-graphs quantity-model';
 const add=(content,tag,state)=>{const p=document.createElement('p');p.className='small';p.textContent=content;if(tag)p.dataset[tag]=state;host.append(p);return p;};
 add('x обозначает '+graph.variable+'.');
 const parts=String(value||'').split(';'),selected=graph.trial?[graph.trial]:graph.focus===null||graph.focus===undefined?[]:graph.allowMultiple?parts:parts.slice(graph.focus,graph.focus+1);
 const trials=selected.slice(0,3).map(raw=>[raw,quantityTrial(graph,raw)]).filter(([,trial])=>trial);
 if(!trials.length){for(const row of graph.rows)add(row.name+': '+row.formulaText+' ('+row.unit+').');add('В первом шаге можно подставить число и проверить все величины.');}
 for(const [raw,trial] of trials){
  add('Пробное значение x = '+raw+'.');
  for(const row of trial.rows){
   const warning=row.valid?'':row.domain==='fraction'?' Массовая доля или выполненная часть должна быть больше нуля и не выше единицы.':row.domain==='integer'?' Здесь нужно положительное целое число.':' Нужна положительная величина.';
   const line=add(row.name+': '+(row.value===null?'деление на ноль':row.value+' '+row.unit)+'.'+warning,'quantityMeasure',row.valid?'valid':'invalid');
   if(row.bar&&row.valid){const [n,d='1']=row.value.split('/'),share=Number(n)/Number(d);const bar=document.createElement('progress');bar.max=1;bar.value=share;bar.setAttribute('aria-label',row.name);line.append(' ',bar,' '+(share*100).toLocaleString('ru',{maximumFractionDigits:2})+'%');}
  }
  if(trial.valid)add(graph.summary+' = '+trial.value+' '+graph.unit+'. По условию требуется '+graph.target+' '+graph.unit+'.','quantityComparison',trial.agrees?'agrees':'differs');
  else if(M.parse(raw)?.n<=0)add('Исходная величина x должна быть положительной.','quantityDomain','invalid');
 }
}

function journeyTrial(graph, raw){
 const fields=fractionSample(raw,1);
 if(!fields)return null;
 const evaluate=(left,right)=>sourceFractionTrial({symbols:['x'],original:left,reduced:right},raw);
 const rows=graph.legs.map(leg=>{
  const {original:distance,reduced:speed}=evaluate(leg.distance,leg.speed);
  const positive=v=>v!==null&&v!=='0'&&!v.startsWith('-');
  const valid=positive(distance)&&positive(speed);
  const time=valid?evaluate(['/',leg.distance,leg.speed],'0').original:null;
  return {name:leg.name,distance,speed,time,valid};
 });
 const valid=rows.every(row=>row.valid);
 const comparison=valid?evaluate(graph.timeComparison,graph.target):null;
 return {rows,valid,comparison:comparison?.original??null,agrees:valid&&comparison.original===comparison.reduced};
}

function travelTimes(host, graph, value){
 host.className='task-graphs quantity-model';
 const add=(content,tag,state)=>{const p=document.createElement('p');p.className='small';p.textContent=content;if(tag)p.dataset[tag]=state;host.append(p);};
 add('x — '+graph.variable+'. Время каждого участка равно его длине, делённой на скорость.');
 const entries=graph.trial?[graph.trial]:graph.speedAnswer?String(value||'').split(';'):[];
 const trials=entries.slice(0,3).map(raw=>[raw,journeyTrial(graph,raw)]).filter(([,trial])=>trial);
 if(!trials.length){
  for(const leg of graph.legs)add(leg.name+': '+leg.distanceText+' км, '+leg.speedText+' км/ч.');
  add('В первом шаге можно подставить пробную скорость и сравнить времена по условию.');
 }
 for(const [raw,trial] of trials){
  add('Подстановка x = '+raw+' км/ч.');
  for(const row of trial.rows){
   add(row.name+': '+row.distance+' км, '+row.speed+' км/ч. '+(row.valid?'Время '+row.time+' ч.':'Такой участок невозможен: нужны положительные длина и скорость.'),'travelLeg',row.valid?'valid':'invalid');
  }
  if(trial.valid)add(graph.relation[0].toUpperCase()+graph.relation.slice(1)+': '+trial.comparison+' ч. По условию требуется '+graph.target+' ч.','travelComparison',trial.agrees?'agrees':'differs');
 }
}

function rateTable(host,config,value){
 host.className='task-graphs quantity-model';
 const entries=String(value||'').split(';').map(x=>x.trim());
 const selected=config.all?entries:[entries[config.answerIndex||0]];
 const caption=document.createElement('p');
 caption.className='small';
 caption.textContent='Подставь своё значение x ('+config.varName+'). Для каждой строки сравни целое и делитель.';
 host.append(caption);
 const fraction=(n,d)=>{
  const gcd=(a,b)=>b?gcd(b,a%b):a;
  const g=gcd(n<0n?-n:n,d);
  return d/g===1n?String(n/g):n/g+'/'+d/g;
 };
 const renderRows=x=>{
  for(const row of config.rows){
   const line=document.createElement('p');line.className='small';line.dataset.rateRow='';
   line.textContent=row.label+' · '+row.total+' / ('+row.denominator+')';
   if(x){
    const denom=BigInt(row.slope)*BigInt(x.n)+BigInt(row.offset)*BigInt(x.d),result=document.createElement('strong');
    result.dataset.rateResult='';result.textContent=fraction(BigInt(row.total)*BigInt(x.d),denom)+' '+config.unit;
    line.append(' = ',result);
   }
   host.append(line);
  }
 };
 if(!selected.some(Boolean)){renderRows(null);return;}
 for(const raw of selected.slice(0,6)){
  if(!raw)continue;
  const x=M.parse(raw);
  if(!x){renderRows(null);continue;}
  const note=document.createElement('p');note.className='small';note.textContent='Подстановка x = '+raw;
  host.append(note);
  if((config.inclusiveMin?x.n<config.min*x.d:x.n<=config.min*x.d)||(config.max!==undefined&&x.n>=config.max*x.d)||(config.integer&&x.d!==1)){
   note.dataset.rateDomain='';note.textContent+=' не подходит по смыслу. Нужно x '+(config.inclusiveMin?'≥ ':'> ')+config.min+
      (config.max!==undefined?' и x < '+config.max:'')+(config.integer?', целое число':'')+'.';
  }else renderRows(x);
 }
}
function rationalEquationModel(host,config,value){
 host.className='task-graphs quantity-model';const note=document.createElement('p');note.className='small';
 if(!config.checked||!config.terms){
  note.textContent='После проверки можно проследить для каждого предложенного корня: разрешают ли его знаменатели и верно ли исходное равенство.';host.append(note);return;
 }
 if(!config.terms.length){
  note.textContent='Ты указал, что решений нет. Проверь отдельно кандидатов уравнения без дробей и исходные ограничения.';host.append(note);return;
 }
 for(const {term,status} of config.terms){
  const row=document.createElement('p');row.className='small';row.dataset.candidateStatus=status;
  row.textContent=term+' — '+({excluded:'значение обнуляет исходный знаменатель; его нужно исключить.',correct:'все знаменатели определены и равенство выполняется.',different:'знаменатели допустимы, но исходное равенство не выполняется.'})[status];host.append(row);
 }
}
function reciprocalExample(host,config,value){
 host.className='task-graphs root-graph';
 const caption=document.createElement('p');caption.className='small';
 if(!config.analysis){
  caption.textContent='Введи коэффициенты a и b, чтобы построить свою прямую и гиперболу.';host.append(caption);return;
 }
 const {a,b,count,discriminant}=config.analysis,points=[];
 if(a===0&&b!==0)points.push([1/b,b]);
 if(a!==0&&count===1){const x=-b/(2*a);points.push([x,1/x]);}
 if(a!==0&&count===2){
  const q=-(b+(b>=0?1:-1)*Math.sqrt(discriminant))/2;
  for(const x of [q/a,-1/q])points.push([x,1/x]);
 }
 const xs=points.map(p=>p[0]);const ys=points.map(p=>p[1]);
 // Fit each axis independently so intersections remain visible for steep lines.
 const xEnd=Math.max(3,...xs.map(Math.abs))*1.18,yEnd=Math.max(3,Math.abs(b),...ys.map(Math.abs))*1.18;
 const visible=points.filter(p=>p.every(Number.isFinite));
 const plane={curves:[{kind:'hyperbola',k:1,xs:[-2,-1,1,2,...xs]},{kind:'line',k:a,b,dashed:true,xs}],points:config.checked?visible:[],xRange:[-xEnd,xEnd],yRange:[-yEnd,yEnd],
  compactTicks:Math.max(xEnd,yEnd)>1000,label:'Сплошная гипербола y = 1/x и твоя штриховая прямая'};
 const svg=rootGraph(plane,'');svg.dataset.reciprocalSlope=String(a);svg.dataset.reciprocalIntercept=String(b);host.append(svg);
 caption.textContent='Сплошная кривая — y = 1/x, штриховая прямая определяется твоими a и b.'+(config.checked?' Число действительных точек встречи: '+count+'.':'');
 host.append(caption);
}

function coefficientExample(host,config,value){
 host.className='task-graphs root-graph';
 const caption=document.createElement('p');caption.className='small';
 const fields=String(value).split(';').slice(0,3),coeffs=fields.map(v=>M?.parse(v));
 if(fields.length!==3||coeffs.some(x=>!x||x.d!==1||x.n<=0)){
  caption.textContent='Для модели введи три положительных целых коэффициента и разложение после следующей точки с запятой.';host.append(caption);return;
 }
 const [a,b,c]=coeffs.map(v=>BigInt(v.n));
 const discriminant=b*b-4n*a*c;
 caption.textContent='Твой трёхчлен: '+a+'x² + '+b+'x + '+c+'.';
 if(config.evaluated){
  caption.textContent+=' D = '+discriminant+'. '+(discriminant<0n?'У этого примера нет действительных пересечений с осью x.':'Можно проверить линейные множители по действительным корням.');
  const B=Number(b)/Number(a),C=Number(c)/Number(a);
  if(B<=10&&C<=10){
   const h=-B/2,k=C-B*B/4,radius=Math.max(1.75,Math.sqrt(Math.max(0,-k))*1.4),points=[];
   if(discriminant>=0n){const delta=Math.sqrt(Number(discriminant))/Number(2n*a);points.push([h-delta,0]);if(delta)points.push([h+delta,0]);}
   const plane={curves:[{kind:'quadratic',a:1,b:B,c:C}],points,xRange:[h-radius,h+radius],yRange:[Math.min(k,-.5)-.5,Math.max(k+radius*radius,.5)+.5],label:'Корни твоего трёхчлена на графике P(x)/A'};
   const svg=rootGraph(plane,'');svg.dataset.exampleDiscriminant=String(discriminant);host.append(svg);caption.textContent+=' Показан график P(x)/A с теми же нулями.';
  }
 }
 host.append(caption);
}

function vertexForm(host,config,value){
 host.className='task-graphs root-graph';
 const parts=String(value).split(';').map(v=>number(v)),pointOnly=config.mode==='point';
 const caption=document.createElement('p');caption.className='small';
 if(parts.length!==(pointOnly?2:3)||parts.some(v=>v===null)){
  caption.textContent=pointOnly?'Введи обе координаты предложенной вершины: на чертеже появится твоя точка.':'Запись A; h; k построит твою параболу с вершиной (h; k).';host.append(caption);return;
 }
 const [a,h,k]=pointOnly?[config.a,...parts]:parts;
 if(!a){caption.textContent='При A = 0 получается постоянная функция. У исходного квадратного трёхчлена A отличается от нуля.';host.append(caption);return;}
 const fmt=n=>Number(n.toFixed(6)).toLocaleString('ru',{maximumFractionDigits:6});
 const curve=(a,h,k,dashed=false)=>({kind:'quadratic',a,b:-2*a*h,c:a*h*h+k,dashed});
 const curves=pointOnly?[]:[curve(a,h,k)];
 if(config.evaluated)curves.push(curve(config.a,config.h,config.k,true));
 const xs=config.evaluated?[h,config.h]:[h],left=Math.min(...xs)-2,right=Math.max(...xs)+2;
 const limits=[k];for(const q of curves){
  const center=-q.b/(2*q.a);limits.push(curveValue(q,left),curveValue(q,right),curveValue(q,center));
 }
 let bottom=Math.min(...limits),top=Math.max(...limits);const margin=Math.max(1,(top-bottom)*.13);bottom-=margin;top+=margin;
 const formula=fmt(a)+'(x '+(h<0?'+':'−')+' '+fmt(Math.abs(h))+')² '+(k<0?'−':'+')+' '+fmt(Math.abs(k));
 const note=pointOnly?'Предложенная точка ('+fmt(h)+'; '+fmt(k)+').':'Твоя запись: '+formula+'. Вершина ('+fmt(h)+'; '+fmt(k)+').';
 const svg=rootGraph({curves,points:[[h,k]],xRange:[left,right],yRange:[bottom,top],compactTicks:Math.max(Math.abs(bottom),Math.abs(top))>1000,label:note},'');
 caption.textContent=note+(config.evaluated?' Штриховая линия показывает исходный трёхчлен.':'');
 host.append(svg,caption);
}
function legTrial(host,value){
 host.className='task-graphs quantity-model';
 const caption=document.createElement('p');caption.className='small';
 const x=number(value);
 if(x===null||x<=0||x>=6){
  caption.textContent=String(value).trim()?'Оба катета должны иметь положительную длину: 0 < x < 6.':'Укажи возможный катет от 0 до 6 см, исключая концы. Изменяя длину, сравнивай площади.';
  host.append(caption);return;
 }
 const other=6-x,area=x*other/2,scale=138/Math.max(x,other),w=x*scale,h=other*scale;
 const svg=node('svg',{viewBox:'0 0 260 190',role:'img','aria-label':'Прямоугольный треугольник для введённого катета'});
 const fmt=n=>n.toLocaleString('ru',{maximumFractionDigits:6});
 svg.append(node('polygon',{points:[[58,154],[58+w,154],[58,154-h]].map(p=>p.join(',')).join(' '),fill:'#d3eee7',stroke:'#166753','stroke-width':2,'data-first-leg':x,'data-second-leg':other,'data-trial-area':area}));
 svg.append(node('text',{x:58+w/2,y:175,'font-size':15,'text-anchor':'middle'},fmt(x)+' см'));
 svg.append(node('text',{x:29,y:154-h/2,'font-size':15,'text-anchor':'middle'},fmt(other)+' см'));
 caption.textContent='Катеты '+fmt(x)+' и '+fmt(other)+' см. Текущая площадь '+fmt(area)+' см².';host.append(svg,caption);
}

function vietaRelations(host,config,value){
 host.className='task-graphs quantity-model';
 const parts=String(value).split(';');
 const hasPair=parts.length===2&&parts.every(part=>M?.parse(part));
 const description=document.createElement('p');description.className='small';
 if(!hasPair){
  description.textContent='Две независимые проверки: сумма корней S = −b/a и произведение P = c/a. После ответа модель сопоставит их с твоей парой.';
  host.append(description);return;
 }
 for(const [i,key,title] of [[0,'sum','Сумма'],[1,'product','Произведение']]){
  const same=M.equal(parts[i],config[key]);
  const row=document.createElement('p');row.className='small';row.dataset.vietaRelation=key;row.dataset.match=String(same);
  row.textContent=title+': '+parts[i].trim()+' — '+(same?'совпадает':key==='sum'?'проверь обратный знак и деление на a':'проверь свободный член и деление на a')+'.';
  host.append(row);
 }
 const values=parts.map(p=>number(p)),[s,p]=values;
 if(values.every(n=>n!==null)){
  const discriminant=s*s-4*p;
  description.textContent='Из введённых S и P получится t² − St + P = 0. У полученного уравнения '+(discriminant<0?'нет действительных корней.':discriminant===0?'один двукратный корень.':'два различных действительных корня.');
  host.append(description);
 }
}

function appliedShape(host,config,value){
 host.className='task-graphs quantity-model';
 const svg=node('svg',{viewBox:'0 0 300 175',role:'img'}),caption=document.createElement('p');
 caption.className='small';
 const rect=(x,y,w,h,attrs={})=>svg.append(node('rect',{x,y,width:w,height:h,fill:'#d8eeeb',stroke:'#184e56','stroke-width':1.7,...attrs}));
 const line=(x1,y1,x2,y2,attrs={})=>svg.append(node('line',{x1,y1,x2,y2,stroke:'#184e56','stroke-width':1.8,...attrs}));
 const label=(x,y,t)=>svg.append(node('text',{x,y,'text-anchor':'middle','font-size':15,fill:'#17393f'},t));
 const fmt=n=>Number(n.toFixed(4)).toLocaleString('ru');
 const scene=config.scene;
 if(scene==='scaled-cuts'){
  const entries=String(value).trim().split(';').map(part=>number(part,100));
  const [total,a,b,h]=entries;
  const valid=entries.length===4&&entries.every(x=>x!==null&&x>0)&&a<b&&b<total;
  if(valid){
   const scale=Math.min(235/total,104/h),x=32,y=32,w=total*scale,height=h*scale;
   rect(x,y,w,height,{fill:'#f3f7f6','data-source-cut':'sheet'});rect(x+a*scale,y,(b-a)*scale,height,{'data-source-cut':'middle'});
   line(x+a*scale,y,x+a*scale,y+height,{'stroke-dasharray':'3 3'});line(x+b*scale,y,x+b*scale,y+height,{'stroke-dasharray':'3 3'});
   label(x+w/2,20,'Лист '+fmt(total)+' × '+fmt(h)+' см');label(x+w/2,159,'Разрезы: '+fmt(a)+' и '+fmt(b)+' см');
   caption.textContent='Чертёж по твоим размерам. Ширина левой, средней и правой частей: '+[a,b-a,total-b].map(fmt).join('; ')+' см на бумаге.';
  }else{
   line(28,114,272,114);line(28,107,28,121);label(29,142,'0');label(150,62,'Масштаб 1 : 2');
   caption.textContent=String(value).trim()?'Для построения нужны четыре положительные длины. Отметки идут от левого края и лежат внутри листа.':'Размеры чертежа вводятся ниже. После ввода увидишь расположение обоих разрезов.';
  }
 }else if(scene==='round-robin'){
  const pts=[[150,20],[241,77],[207,141],[93,141],[59,77]];
  for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++)line(...pts[i],...pts[j],{stroke:i===0?'#226776':'#a3b4b4','stroke-dasharray':i===0?'none':'4 3'});
  pts.forEach(([x,y],i)=>{svg.append(node('circle',{cx:x,cy:y,r:8,fill:i===0?'#a34725':'#225963'}));});
  caption.textContent='Пример с пятью участниками. Точка — участник, линия — общая игра. Сплошные линии показывают все встречи одного участника. Каждая линия имеет два конца.';
 }else if(scene==='box-net'){
  const x=47,y=14,w=195,h=130,d=30;
  rect(x,y,w,h,{fill:'#f5f7f4','stroke-dasharray':'4 3'});rect(x+d,y,w-2*d,h);rect(x,y+d,w,h-2*d);
  rect(x+d,y+d,w-2*d,h-2*d,{fill:'#b9ddd6','stroke-dasharray':'5 3'});
  label(x+w/2,y+h/2+4,'дно');label(x+w/2,167,'60 см');label(25,85,'40');label(x+d/2,y+19,'x');
  caption.textContent='Четыре угловых квадрата убирают. По штриховым линиям отгибают четыре борта. Дно — внутренний прямоугольник.';
 }else if(scene==='end-squares'){
  rect(26,42,248,64,{fill:'#f8f3e5'});rect(90,42,120,64);line(90,42,90,106);line(210,42,210,106);
  label(150,28,'26 см');label(59,80,'x');label(240,80,'x');label(150,82,'26 − 2x');label(150,143,'Ширина листа — x');
  caption.textContent='Два крайних квадрата вырезают. Средний участок сохраняет ширину листа.';
 }else if(scene==='triangle'){
  const x=60,y=128,w=166,h=w*config.h/config.w;
  svg.append(node('polygon',{points:[[x,y],[x+w,y],[x,y-h]].map(p=>p.join(',')).join(' '),fill:'#d8eeeb',stroke:'#184e56','stroke-width':2}));
  line(x+10,y,x+10,y-10);line(x+10,y-10,x,y-10);label(x+w/2,y+22,config.label1);label(x-23,y-h/2,config.label2);
  caption.textContent='Подписи относятся к перпендикулярным сторонам. Наклонная сторона — гипотенуза. Схема помогает составить уравнение.';
 }else{
  const x=58,y=22,w=182,h=Math.min(107,w*config.h/config.w);
  rect(x,y,w,h);
  if(config.diagonal){line(x,y+h,x+w,y,{'stroke-dasharray':'5 3'});label(x+w*.7,y+h*.67,config.diagonal);}
  if(scene==='square-cut'){line(x+h,y,x+h,y+h,{'stroke-dasharray':'5 3'});label(x+(w+h)/2,y+h/2+5,'120 см');}
  if(scene==='seats'){
   for(let row=0;row<4;row++)for(let col=0;col<7;col++)svg.append(node('circle',{cx:x+18+col*24,cy:y+18+row*23,r:4,fill:'#286477'}));
  }
  label(x+w/2,y+h+22,config.label1);label(29,y+h/2,config.label2);
  caption.textContent=scene==='seats'?'Схема показывает, как строки и столбцы образуют произведение. Точки на примере не задают число мест в условии.':scene==='square-cut'?'Штриховая линия — распил. Квадрат и прямоугольная часть имеют одинаковую ширину.':'Соседние подписи обозначают разные стороны. Противоположные стороны равны.';
 }
 svg.setAttribute('aria-label',caption.textContent);host.append(svg,caption);
}

function render(host,config,value){
 if(!host||!config)return;host.replaceChildren();
 if(config.learnerIntersections){
  const points=parseIntegerPairs(value)||[];
  config=config.type==='line-figure'?{...config,fixedPoints:points}:{...config,points};
 }
 if(['quadratic-discriminant','quadratic-parameter','quadratic-reciprocals','check-common-point'].includes(config.type)){quadraticEvidence(host,config,value);return;}
 if(config.type==='rational-line-example'){reciprocalExample(host,config,value);return;}
 if(config.type==='rational-equation-check'){rationalEquationModel(host,config,value);return;}
 if(config.type==='coefficient-example'){coefficientExample(host,config,value);return;}
 if(config.type==='vertex-form'){vertexForm(host,config,value);return;}
 if(['line-figure','own-lines','own-points'].includes(config.type)){planeConstruction(host,config,value);return;}
 if(config.type==='abs-line-choice'){absLineChoice(host,config);return;}
 if(config.type==='system-pair-audit'){systemPairModel(host,config);return;}
 if(config.type==='inequality-intervals'){inequalityIntervals(host,config);return;}
 if(['rational-intersections','rational-root-audit','graph-root-reading'].includes(config.type)){rationalScene(host,config);return;}
 if(config.type==='source-fraction'){sourceFractionScene(host,config);return;}
 if(config.type==='factor-witness'){
  host.className='task-graphs quantity-model';
  const parts=String(value||'').split(';');
  if(parts.length===3&&config.audit){
   const caption=document.createElement('p');caption.className='small';caption.dataset.factorProduct='';
   caption.textContent='Твоё произведение: ('+parts[0]+')·(x − ('+parts[1]+'))·(x − ('+parts[2]+')).';host.append(caption);
   for(const [name,good] of [['Старший коэффициент',config.rightLeading],['Сумма корней',config.audit.sum],['Произведение корней',config.audit.product]]){
    const row=document.createElement('p');row.className='small';row.dataset.factorWitness=good?'yes':'no';row.textContent=name+(good?' совпадает.':' отличается.');host.append(row);
   }
  }else {const row=document.createElement('p');row.className='small';row.textContent='Введи A и оба корня: модель составит твоё произведение линейных множителей.';host.append(row);}
  return;
 }
 if(config.type==='vieta-audit'){
  host.className='task-graphs quantity-model';
  for(const [name,label] of [['sum','Сумма'],['product','Произведение']]){
   const p=document.createElement('p');p.className='small';p.dataset.vietaRelation=name;
   p.textContent=label+' по коэффициентам: '+config[name]+'. ';
   if(config.audit){const good=config.audit[name];p.dataset.vietaCheck=good?'yes':'no';p.textContent+=good?'Введённые числа дают это значение.':'Введённые числа дают другое значение.';}
   else p.textContent+='Введи оба корня для точной проверки.';
   host.append(p);
  }
  return;
 }
 if(config.type==='number-sequence'){sequenceScene(host,config,value);return;}
 if(config.type==='applied-measure'){measureScene(host,config,value);return;}
 if(config.type==='square-certificate'){squareCertificateScene(host,config,value);return;}
 if(config.type==='root-residual'){residualScene(host,config);return;}
 if(config.type==='parameter-polynomial'){parameterScene(host,config);return;}
 if(config.type==='story-balance'){balanceScene(host,config,value);return;}
 if(config.type==='two-equations'){equationExamples(host,value);return;}
 if(config.type==='source-inequality-case'){sourceInequalityCase(host,config,value);return;}
 if(config.type==='source-behavior-review'){behaviorView(host,config,value);return;}
 if(config.type==='source-function-features'){featureView(host,config,value);return;}
 if(config.type==='source-reading-graph'){graphReadingView(host,config,value);return;}
 if(config.type==='source-function-domain'){functionDomainView(host,config,value);return;}
 if(config.type==='source-function-values'){functionSourceView(host,config,value);return;}
 if(config.type==='source-applied-bounds'){appliedBoundsView(host,config,value);return;}
 if(config.type==='source-solution-audit'){solutionAudit(host,config,value);return;}
 if(config.type==='interval-set-review'){intervalSetReview(host,config,value);return;}
 if(config.type==='geometry-bound-review'){geometryBoundView(host,config,value);return;}
 if(config.type==='source-proof-review'){proofReviewModel(host,config);return;}
 if(config.type==='source-system-review'){systemReviewView(host,config,value);return;}
 if(config.type==='source-system-rays'){systemTrialView(host,config,value);return;}
 if(config.type==='linear-ray-trial'){linearTrialGraph(host,config,value);return;}
 if(config.type==='source-interval-axis'){intervalNumberLine(host,config,value);return;}
 if(config.type==='interval-review'){intervalReview(host,config,value);return;}
 if(config.type==='euler-operation'){eulerDiagram(host,config,value);return;}
 if(config.type==='overlap-segments'){segmentDiagram(host,config,value);return;}
 if(['proportion-coefficient','harvest-check'].includes(config.type)){setReview(host,config,value);return;}
 if(config.type==='combined-intervals'){combinedBounds(host,config);return;}
 if(config.type==='two-comparisons'){comparisonPair(host,config,value);return;}
 if(config.type==='power-order'){powerOrder(host,config);return;}
 if(config.type==='median-investigation'){medianFigure(host,config,value);return;}
 if(config.type==='diagonal-proof'){diagonalProof(host,config);return;}
 if(['mean-factors','signed-square-proof','library-area','cancel-ratio','cut-square'].includes(config.type)){contextBound(host,config,value);return;}
 if(config.type==='interval-image'){estimateDiagram(host,config);return;}
 if(config.type==='rank-expressions'){rankExpressions(host,config);return;}
 if(config.type==='compare-surd-values'){surdComparison(host,config,value);return;}
 if(config.type==='square-substitution'){squareSubstitution(host,config);return;}
 if(config.type==='labelled-order'){labelledOrder(host,config,value);return;}
 if(config.type==='transformed-numbers'){transformedNumbers(host,config,value);return;}
 if(config.type==='radical-comparison'){radicalComparison(host,config,value);return;}
 if(config.type==='inequality-evidence'){inequalityScene(host,config,value);return;}
 if(config.type==='linear-review'){linearReview(host,config,value);return;}
 if(config.type==='quantity-audit'){quantityAudit(host,config,value);return;}
 if(config.type==='travel-times'){travelTimes(host,config,value);return;}
 if(config.type==='rate-table'){rateTable(host,config,value);return;}
 if(config.type==='leg-trial'){legTrial(host,value);return;}
 if(config.type==='vieta-relations'){vietaRelations(host,config,value);return;}
 if(config.type==='applied-shape'){appliedShape(host,config,value);return;}
 if(config.type==='quadratic-story'){quadraticStory(host,config,value);return;}
 if(config.type==='quadratic-example'){quadraticExample(host,value);return;}
 if(['work-hours','equal-distances'].includes(config.type)){workEstimate(host,config,value);return;}
 if(['intersection-example','shared-hyperbola-line'].includes(config.type)){
  host.className='task-graphs root-graph';
  const own=config.type==='shared-hyperbola-line',params=own?parseLine(value):config.reveal?{k:config.k,b:config.line[1]}:null;
  const curves=params?[{kind:'hyperbola',k:params.k},{kind:'line',k:own?params.k:config.line[0],b:params.b}]:[];
  const points=own?[config.point]:config.reveal?config.points:[];
  const bound=own?Math.max(6,Math.abs(config.point[0])+2,Math.abs(config.point[1])+2):5;
  host.append(rootGraph({type:'root-plane',curves,points,xRange:[-bound,bound],yRange:[-bound,bound]},''));
  const note=document.createElement('p');note.className='small';note.textContent=own?'Данная точка отмечена. После проверки на осях появятся обе кривые по введённым k и b.':config.reveal?'Показаны кривые и точки именно из примера доказательства.':'После попытки можно сопоставить рассуждение с примером на этих осях.';host.append(note);return;
 }
 if(config.type==='natural-values'){renderNaturalValues(host,config);return;}
 if(config.type==='domain-fraction'){renderDomainFraction(host,config);return;}
 if(config.type==='train-meeting'){renderTrainMeeting(host,value);return;}
 if(config.type==='integer-pairs'){renderIntegerPairs(host,config,value);return;}
 if(config.type==='number-line'){host.className='task-graphs number-line';host.append(numberLine(config));if(config.caption){const caption=document.createElement('p');caption.className='small';caption.textContent=config.caption;host.append(caption);}
 }else if(config.type==='line-example'){
  host.className='task-graphs root-graph';
  const line=parseLine(value);
  const caption=document.createElement('p');caption.className='small';
  caption.textContent=line?'Сравни наклон и пересечение с осью y с условием.':'Введи коэффициенты k и b, чтобы построить свою прямую.';
  const plane={...config,type:'root-plane',curves:line?[{kind:'line',...line}]:[]};
  if(line){
   const bound=Math.max(6,Math.abs(line.b),Math.abs(line.b+line.k),Math.abs(line.b-line.k));
   plane.xRange=[-3,3];plane.yRange=[-bound,bound];
  }
  host.append(rootGraph(plane,''),caption);
 }else if(config.type==='root-line'){
  host.className='task-graphs root-graph';const line=parseLine(value),plane={...config,type:'root-plane',curves:[{kind:'sqrt'},...(line?[{kind:'line',...line}]:[])]};host.append(rootGraph(plane,''));
  const caption=document.createElement('p');caption.className='small';caption.textContent='Видна часть графиков. Число пересечений проверь по уравнению.';host.append(caption);
 }else if(['root-plane','root-build','curve-build'].includes(config.type)){
  host.className='task-graphs root-graph';host.append(rootGraph(config,value));
  const caption=document.createElement('p');caption.className='small';
  caption.textContent=['root-build','curve-build'].includes(config.type)?((config.showSolution&&config.completeCaption)||config.caption||'Введи ординаты точек ниже — они появятся на твоём чертеже.'):(config.caption||'На рисунке показана часть графика. Проверяй выводы по формуле.');host.append(caption);
 }else if(config.type==='choices'||config.type==='hyperbola-choices'){
  host.className='task-graphs alternatives';
  const inverse=config.type==='hyperbola-choices';
  const graphs=inverse?config.coefficients.map(k=>({k})):alternatives;
  graphs.forEach((g,i)=>{
   const fig=document.createElement('figure'),caption=document.createElement('figcaption'),zoom=document.createElement('button');zoom.type='button';zoom.className='graph-zoom';zoom.textContent='График '+(i+1)+' ↗';zoom.setAttribute('aria-label','Увеличить график '+(i+1));caption.append(zoom);
   const label=inverse?'График '+(i+1)+': при x = 2 значение y примерно '+(g.k/2).toLocaleString('ru',{maximumSignificantDigits:3})+'.':'График '+(i+1)+': y='+g.k+'x'+(g.b<0?'':'+')+g.b+(g.holes.length?', выколотая точка при x='+g.holes[0]:', без выколотых точек');
   const draw=()=>inverse?rootGraph({label,curves:[{kind:'hyperbola',k:g.k}],xRange:[-6,6],yRange:[-6,6],xTickStep:2,yTickStep:2},''):graph(g.k,g.b,g.holes,3,label);
   fig.append(caption,draw());host.append(fig);
   zoom.onclick=()=>{const dialog=document.createElement('dialog'),title=document.createElement('p'),close=document.createElement('button');dialog.className='graph-dialog';dialog.setAttribute('aria-label','Увеличенный график '+(i+1));title.textContent='График '+(i+1);close.type='button';close.textContent='Вернуться к выбору';dialog.append(title,draw(),close);host.append(dialog);close.onclick=()=>dialog.close();dialog.addEventListener('close',()=>{dialog.remove();zoom.focus();},{once:true});dialog.showModal();};
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
return {cubeRead,linearTrial,setTokens,integerProbe,setMembership,cornerValues,coordinateEvidence,admissibleSample,withinBounds,tankTrial,behaviorHeight,featureY,featureAllowed,readingHeight,absDomainTrial,domainAt,domainCoefficients,familyDomain,functionValueAt,betweenSurd,isInAxis,setProbe,inequalityTrial,quantityTrial,journeyTrial,fractionSample,sourceFractionTrial,sequenceRows,sequenceEvidence,parameterSample,parameterExample,parse,parsePair,parseLine,parseRootPoints,parseIntegerPairs,pairEquation,curveValue,alternatives,render,rootGraph,numberLine};
});
